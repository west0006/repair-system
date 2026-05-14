// material/material.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, LessThan } from 'typeorm';
import * as XLSX from 'xlsx';
import { Material } from './material.entity';
import {
  MaterialApplication,
  MaterialApplicationStatus,
} from './material-application.entity';
import { StockIn } from './stock-in.entity';
import { StockOut } from './stock-out.entity';
import { Supplier } from './supplier.entity';
import {
  CreateMaterialDto,
  UpdateMaterialDto,
  MaterialListDto,
} from './dto/material.dto';
import { RepairOrder } from '../order/order.entity';
import { OrderStatus } from '../order/order-status.enum';
import { Category } from './category.entity';
import { NotificationService } from '../common/notification.service';
import { User } from '../auth/user.entity';
import { WechatService } from '../wechat/wechat.service'; // 新增导入

// 定义物料申领项的类型
interface MaterialApplyItem {
  materialId: number;
  quantity: number;
  unitPrice?: number;
  discount?: number;
}

// 定义物料申领 DTO 类型
interface MaterialApplyDto {
  orderId: number;
  items: MaterialApplyItem[];
  reason?: string;
  serviceFee?: number;
  totalDiscount?: number;
}

@Injectable()
export class MaterialService {
  constructor(
    @InjectRepository(Material)
    private materialRepo: Repository<Material>,
    @InjectRepository(RepairOrder)
    private orderRepo: Repository<RepairOrder>, // 保留用于其他方法 (如 getCurrentWarnings 无依赖，但保留以防后续使用)
    @InjectRepository(MaterialApplication)
    private materialAppRepo: Repository<MaterialApplication>,
    @InjectRepository(Category)
    private categoryRepo: Repository<Category>,
    @InjectRepository(User)
    private userRepo: Repository<User>,

    private dataSource: DataSource,
    private notificationService: NotificationService,
    private wechatService: WechatService,
  ) {
    // 若不使用 orderRepo，可将其移除，但此处保留以避免大改动
  }

  async inbound(data: {
    materialId: number;
    quantity: number;
    unitPrice?: number;
    supplierId?: number;
    operatorId?: number;
    remark?: string;
  }) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const material = await queryRunner.manager.findOne(Material, {
        where: { id: data.materialId },
      });
      if (!material) throw new Error('物料不存在');

      await queryRunner.manager.increment(
        Material,
        { id: data.materialId },
        'stock',
        data.quantity,
      );
      const inbound = queryRunner.manager.create(StockIn, {
        orderNo: `IN${Date.now()}`,
        materialId: data.materialId,
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        supplierId: data.supplierId,
        operatorId: data.operatorId,
        remark: data.remark,
      });
      await queryRunner.manager.save(inbound);
      await queryRunner.commitTransaction();
      return inbound;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async importMaterialsFromExcel(buffer: Buffer | Uint8Array) {
    const workbook: XLSX.WorkBook = XLSX.read(buffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet: XLSX.WorkSheet = workbook.Sheets[firstSheetName];
    if (!worksheet) {
      throw new BadRequestException('Excel 文件格式错误或工作表不存在');
    }

    const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    const categories = await this.categoryRepo.find();
    const materials: CreateMaterialDto[] = [];

    for (let i = 2; i < rows.length; i++) {
      const row = rows[i];
      const name = row[1]?.toString().trim();
      if (!name) continue;

      const categoryId = this.guessCategoryId(name, categories) ?? undefined;
      materials.push({
        name,
        spec: '',
        unit: '个',
        price: 0,
        categoryId,
        minStock: 10,
        maxStock: 100,
      });
    }

    await this.materialRepo.upsert(materials, ['name']);
    return { total: materials.length };
  }

  private guessCategoryId(name: string, categories: Category[]): number | null {
    const lower = name.toLowerCase();
    if (/灯|开关|电|线|空开|插座|镇流器|表|继电器|接触器/.test(lower)) {
      return categories.find((c) => c.name === '电工类')?.id ?? null;
    }
    if (
      /水|阀|管|龙头|PPR|PVC|接头|淋浴|马桶|小便|大便|感应|延时/.test(lower)
    ) {
      return categories.find((c) => c.name === '水暖类')?.id ?? null;
    }
    if (/门|窗|锁|合页|把手|家具|床|桌|椅|木|玻璃|纱窗|执手/.test(lower)) {
      return categories.find((c) => c.name === '木工类')?.id ?? null;
    }
    return categories.find((c) => c.name === '其他')?.id ?? null;
  }

  async outbound(data: {
    materialId: number;
    quantity: number;
    reason: string;
    repairOrderId?: number;
    applicantId?: number;
    approverId?: number;
  }) {
    const material = await this.materialRepo.findOne({
      where: { id: data.materialId },
    });
    if (!material) throw new NotFoundException('物料不存在');
    if (material.stock < data.quantity)
      throw new BadRequestException('库存不足');

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await queryRunner.manager.decrement(
        Material,
        { id: data.materialId },
        'stock',
        data.quantity,
      );
      const outbound = queryRunner.manager.create(StockOut, {
        orderNo: `OUT${Date.now()}`,
        materialId: data.materialId,
        quantity: data.quantity,
        reason: data.reason,
        repairOrderId: data.repairOrderId,
        applicantId: data.applicantId,
        approverId: data.approverId,
        status: 2,
      });
      await queryRunner.manager.save(outbound);
      await queryRunner.commitTransaction();
      return outbound;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async apply(data: MaterialApplyDto, applicantId: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      // 1. 获取工单信息
      const order = await queryRunner.manager.findOne(RepairOrder, {
        where: { id: data.orderId },
      });
      if (!order) throw new NotFoundException('工单不存在');

      // 判断是否需要支付：通过 userId 查找用户角色
      let isTeacherCreated = false;
      if (order.userId) {
        const orderUser = await queryRunner.manager.findOne(User, {
          where: { id: order.userId },
          select: ['role'],
        });
        isTeacherCreated = orderUser?.role === 1; // 师傅创建的工单
      }
      const needPayment = !isTeacherCreated && data.items.length > 0;

      // 2. 加悲观锁锁定物料，同时构建物料账单明细
      const materialBillItems = []; // 新增
      for (const item of data.items) {
        const material = await queryRunner.manager.findOne(Material, {
          where: { id: item.materialId },
          lock: { mode: 'pessimistic_write' },
        });
        if (!material)
          throw new NotFoundException(`物料 ${item.materialId} 不存在`);
        const available = material.stock - material.lockedStock;
        if (available < item.quantity) {
          throw new BadRequestException(`物料 ${material.name} 可用库存不足`);
        }
        material.lockedStock += item.quantity;
        await queryRunner.manager.save(material);

        // 收集物料账单明细
        materialBillItems.push({
          material_id: item.materialId,
          material_name: material.name,
          spec: material.spec || '',
          quantity: item.quantity,
          unit_price:
            item.unitPrice && item.unitPrice > 0
              ? item.unitPrice
              : (material.price ?? 0),
          discount: item.discount ?? 1.0,
        });
      }

      // 3. 计算费用
      const materialTotal = materialBillItems.reduce(
        (sum, item) =>
          sum + (item.unit_price || 0) * item.quantity * item.discount,
        0,
      );
      const totalDiscount = data.totalDiscount ?? 1.0;
      const serviceFee = data.serviceFee ?? 0;
      const payAmount = materialTotal * totalDiscount + serviceFee;

      // 4. 创建申领单
      const application = this.materialAppRepo.create({
        orderId: data.orderId,
        applicantId,
        items: data.items,
        reason: data.reason,
        serviceFee,
        totalDiscount,
        payAmount: needPayment ? payAmount : 0,
        status: needPayment
          ? MaterialApplicationStatus.PENDING_PAYMENT
          : MaterialApplicationStatus.FREE,
        lockExpiresAt: needPayment
          ? new Date(Date.now() + 10 * 60 * 1000)
          : undefined, // 修复：避免 null 类型错误
        paymentStatus: 0,
      });
      await queryRunner.manager.save(application);

      // 5. 更新工单状态
      if (needPayment) {
        order.status = OrderStatus.AWAITING_PAYMENT;
        order.material_bill_status = 2; // 待支付
        order.material_bill_pay_amount = payAmount;
        order.serviceFee = serviceFee;
        order.material_bill_amount = materialTotal;
        order.material_bill_discount = totalDiscount;
        order.material_bill = materialBillItems;
      } else {
        order.status = OrderStatus.REPAIRING;
        order.material_bill_status = 1; // 待审核（后置）
        order.material_bill_pay_amount = 0;
        order.serviceFee = serviceFee;
        order.material_bill_amount = materialTotal;
        order.material_bill_discount = totalDiscount;
        order.material_bill = materialBillItems;

        for (const item of data.items) {
          const outbound = queryRunner.manager.create(StockOut, {
            orderNo: `OUT${Date.now()}`,
            materialId: item.materialId,
            quantity: item.quantity,
            reason: '工单申领',
            repairOrderId: data.orderId,
            applicantId,
            status: 1, // 待审核
            outboundType: 'order',
          });
          await queryRunner.manager.save(outbound);
        }
      }
      await queryRunner.manager.save(order);
      await queryRunner.commitTransaction();

      // 6. 支付场景通知
      if (needPayment) {
        await this.notificationService.create({
          userId: order.userId,
          title: '待支付物料费用',
          content: `工单 ${order.orderNo} 需支付 ${payAmount} 元，请及时支付`,
          link: `/order/detail/${order.id}`,
        });
      }
      const receiver = await this.userRepo.findOne({
        where: { id: order.userId },
      });
      if (receiver?.openid) {
        await this.wechatService.sendSubscribeMessage({
          touser: receiver.openid,
          templateId: 'X2I9ICBuHRa9YBWXPNp-DmnyiAENZa4h9O7IvfYQVL8',
          page: `/pages/user/orderDetail?id=${order.id}`,
          data: {
            订单编号: { value: order.orderNo },
            订单金额: { value: `${payAmount}元` },
            费用类型: {
              value: `物料费${materialTotal}元 + 服务费${serviceFee}元`,
            },
            支付剩余时间: { value: '10分钟' },
          },
        });
      }
      return application;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async getCurrentWarnings() {
    const lowStock = await this.materialRepo
      .createQueryBuilder('m')
      .where('m.stock < m.minStock')
      .getMany();
    const highStock = await this.materialRepo
      .createQueryBuilder('m')
      .where('m.stock > m.maxStock')
      .getMany();
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
    const expiring = await this.materialRepo.find({
      where: { expiryDate: LessThan(sevenDaysLater) },
    });
    return { lowStock, highStock, expiring };
  }

  async create(dto: CreateMaterialDto): Promise<Material> {
    const material = this.materialRepo.create(dto);
    return this.materialRepo.save(material);
  }

  async findOne(id: number): Promise<Material> {
    const material = await this.materialRepo.findOne({ where: { id } });
    if (!material) throw new NotFoundException('物料不存在');
    return material;
  }

  async update(id: number, dto: UpdateMaterialDto): Promise<Material> {
    await this.findOne(id);
    await this.materialRepo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.materialRepo.delete(id);
  }

  async findAllPaginated(
    query: MaterialListDto,
    page: number,
    limit: number,
  ): Promise<[Material[], number]> {
    const qb = this.materialRepo.createQueryBuilder('m');
    if (query.categoryId)
      qb.andWhere('m.categoryId = :categoryId', {
        categoryId: query.categoryId,
      });
    if (query.name)
      qb.andWhere('m.name LIKE :name', { name: `%${query.name}%` });
    if (query.supplierId)
      qb.andWhere('m.supplierId = :supplierId', {
        supplierId: query.supplierId,
      });
    const [data, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return [data, total];
  }

  async approveApplication(id: number, approverId: number) {
    const application = await this.materialAppRepo.findOne({ where: { id } });
    if (!application) throw new NotFoundException('申请单不存在');
    if (application.status !== MaterialApplicationStatus.PENDING_PAYMENT)
      throw new BadRequestException('申请单已处理');

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      for (const item of application.items) {
        const material = await queryRunner.manager.findOne(Material, {
          where: { id: item.materialId },
        });
        if (!material)
          throw new NotFoundException(`物料 ${item.materialId} 不存在`);
        if (material.stock < item.quantity)
          throw new BadRequestException(`物料 ${material.name} 库存不足`);

        await queryRunner.manager.decrement(
          Material,
          { id: item.materialId },
          'stock',
          item.quantity,
        );
        const outbound = queryRunner.manager.create(StockOut, {
          orderNo: `OUT${Date.now()}`,
          materialId: item.materialId,
          quantity: item.quantity,
          reason: '工单申领',
          repairOrderId: application.orderId,
          applicantId: application.applicantId,
          approverId,
          status: 2,
        });
        await queryRunner.manager.save(outbound);
      }

      const order = await queryRunner.manager.findOne(RepairOrder, {
        where: { id: application.orderId },
      });
      if (!order) throw new NotFoundException('工单不存在');

      const materialBillItems = [];
      for (const item of application.items) {
        const material = await queryRunner.manager.findOne(Material, {
          where: { id: item.materialId },
        });
        const rawUnitPrice = (item as MaterialApplyItem).unitPrice;
        const unitPrice =
          rawUnitPrice && rawUnitPrice > 0
            ? rawUnitPrice
            : (material?.price ?? 0);
        const discount = (item as MaterialApplyItem).discount ?? 1.0;
        materialBillItems.push({
          material_id: item.materialId,
          material_name: material?.name || '',
          spec: material?.spec || '',
          quantity: item.quantity,
          unit_price: unitPrice,
          discount: discount,
        });
      }

      order.material_bill = materialBillItems;
      order.material_bill_amount = materialBillItems.reduce(
        (sum, i) => sum + i.unit_price * i.quantity * i.discount,
        0,
      );
      order.material_bill_discount = application.totalDiscount;
      order.serviceFee = application.serviceFee;
      order.material_bill_pay_amount = application.payAmount ?? 0;

      if (application.payAmount === 0) {
        order.material_bill_status = 4;
        order.status = OrderStatus.REPAIRING;
      } else {
        order.material_bill_status = 2;
        order.status = OrderStatus.AWAITING_PAYMENT;
      }

      await queryRunner.manager.save(order);
      await queryRunner.manager.update(MaterialApplication, id, {
        status: 2,
        approverId,
      });
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async rejectApplication(id: number, reason: string) {
    const application = await this.materialAppRepo.findOne({ where: { id } });
    if (!application) throw new NotFoundException('申请单不存在');
    if (application.status !== MaterialApplicationStatus.PENDING_PAYMENT)
      throw new BadRequestException('申请单已处理');
    await this.materialAppRepo.update(id, { status: 3, rejectReason: reason });
  }
  // material/material.service.ts

  async fullCleaning(): Promise<{ message: string }> {
    const materials = await this.materialRepo.find();
    const categories = await this.categoryRepo.find();

    // 辅助函数：从名称中移除各种干扰，提取出纯物料名
    const cleanName = (
      raw: string,
    ): { name: string; spec: string; unit?: string } => {
      let name = raw.trim();
      let spec = '';
      let unit: string | undefined;

      // 1. 提取单位（末尾的“/单位”）
      const unitMatch = name.match(
        /\/(个|只|支|根|米|套|把|桶|卷|双|块|包|台|条|片|套|付|扇|对|组|盒|瓶|扎|袋|副|支|张|座|颗|块)$/,
      );
      if (unitMatch) {
        unit = unitMatch[1];
        name = name.slice(0, -unitMatch[0].length).trim();
      }

      // 2. 移除【】和（）中的备注（通常会保留，但先移除后面再处理）
      name = name.replace(/【[^】]*】|（[^）]*）/g, '').trim();

      // 3. 尝试提取明显的规格信息
      // 匹配数字+单位（如1P16A, 600*600, DN25, 14*200, 3P20A, 32A, 10A等）
      const specPatterns = [
        /(\d+[A-Za-z]*\s*[×xX*]\s*\d+[A-Za-z]*)/, // 尺寸：600*600, 10*100
        /(\d+\.?\d*[A-Za-z]+\s*[×xX*]\s*\d+\.?\d*[A-Za-z]*)/, // 带单位尺寸
        /(\d+[A-Za-z]+\s*\d+[A-Za-z]*)/, // 类似1P16A, 4P63A
        /(\d+[A-Za-z]+)/, // 32A, DN25, 25mm, 6分
        /([A-Za-z]+\d+)/, // T5, LED, FSL等，但可能误匹配，谨慎
      ];

      for (const p of specPatterns) {
        const m = name.match(p);
        if (m && m[1].length > 1 && !/^[A-Za-z]+$/.test(m[1])) {
          // 排除纯字母
          spec = m[1];
          name = name.replace(m[1], '').trim();
          break;
        }
      }

      // 4. 如果名称中还有“Φ”、“DN”等特殊标记，提取
      const dnMatch = name.match(/(DN\d+)/i);
      if (dnMatch && !spec) {
        spec = dnMatch[1];
        name = name.replace(dnMatch[1], '').trim();
      }

      // 5. 清理名称中残留的括号、空格、多余标点
      name = name
        .replace(/[【】\(\)（）]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      // 如果名称只剩下数字或空，说明是一个纯规格物料，将数字移入spec
      if (/^\d+$/.test(name) && !spec) {
        spec = name;
        name = '';
      }

      return { name: name || '未命名', spec, unit };
    };

    // 分类猜测函数优化
    const guessCategory = (name: string): number | null => {
      const lower = name.toLowerCase();
      // 电工类
      const elec = categories.find((c) => c.name === '电工类');
      if (
        elec &&
        /电|开关|空开|插座|镇流器|表|继电器|接触器|线|灯|漏电|配电箱|铜芯|电缆|头灯|电锤|焊条|变压器|触发器/.test(
          lower,
        )
      ) {
        return elec.id;
      }
      // 水暖类
      const water = categories.find((c) => c.name === '水暖类');
      if (
        water &&
        /水|阀|管|龙头|PPR|PVC|接头|淋浴|马桶|小便|大便|感应|延时|弯头|三通|堵头|法兰|止回|脚踏|混水|花洒|软管|下水|地漏|存水弯|补芯/.test(
          lower,
        )
      ) {
        return water.id;
      }
      // 木工类
      const wood = categories.find((c) => c.name === '木工类');
      if (
        wood &&
        /门|窗|锁|合页|把手|家具|床|桌|椅|木|玻璃|纱窗|执手|滑道|龙骨|扣板|抽屉|拉手|窗帘|衣杆/.test(
          lower,
        )
      ) {
        return wood.id;
      }
      // 门窗类
      const door = categories.find((c) => c.name === '门窗类');
      if (door && /门|窗|玻璃/.test(lower)) {
        return door.id;
      }
      return null;
    };

    for (const m of materials) {
      const { name, spec, unit } = cleanName(m.name);
      m.name = name;
      if (!m.spec && spec) m.spec = spec;
      if (!m.unit && unit) m.unit = unit;

      // 单位兜底
      if (!m.unit) m.unit = '个';

      // 价格兜底
      if (!m.price || m.price === 0) m.price = 1.0;
      if (!m.standardDiscount) m.standardDiscount = 1.0;

      // 分类修正
      if (!m.categoryId || m.categoryId === 5) {
        const guessed = guessCategory(m.name);
        if (guessed) m.categoryId = guessed;
      }

      // 供应商默认（根据分类）
      if (!m.supplierId) {
        if (m.categoryId === 1)
          m.supplierId = 5; // 电工供应商
        else if (m.categoryId === 2)
          m.supplierId = 6; // 水暖供应商
        else if (m.categoryId === 3 || m.categoryId === 4) m.supplierId = 7; // 木工供应商
      }

      // 库存阈值
      if (!m.minStock || m.minStock === 0) m.minStock = 10;
      if (!m.maxStock || m.maxStock === 0) m.maxStock = 100;

      // 保质期提醒默认
      if (!m.expiryWarningDays) m.expiryWarningDays = 30;
    }

    // 批量保存
    await this.materialRepo.save(materials);
    return { message: `清洗完成，共处理 ${materials.length} 条物料` };
  }

  async getApplications(filters: { status?: number; paymentStatus?: number }) {
    const qb = this.materialAppRepo.createQueryBuilder('a');
    if (filters.status !== undefined && filters.status !== null) {
      qb.andWhere('a.status = :status', { status: filters.status });
    }
    if (filters.paymentStatus !== undefined && filters.paymentStatus !== null) {
      qb.andWhere('a.paymentStatus = :paymentStatus', {
        paymentStatus: filters.paymentStatus,
      });
    }
    return qb.getMany();
  }

  async importInboundFromExcel(
    fileBuffer: Buffer | Uint8Array,
    operatorId: number,
  ): Promise<{ message: string; count: number }> {
    const workbook: XLSX.WorkBook = XLSX.read(fileBuffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet: XLSX.WorkSheet = workbook.Sheets[firstSheetName];
    if (!worksheet) throw new BadRequestException('Excel 文件格式错误');

    const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    const results: StockIn[] = [];
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const materialName = row[0]?.toString().trim() || '';
        const quantity = parseInt(row[1]?.toString() || '0', 10);
        const unitPrice = parseFloat(row[2]?.toString() || '0');
        const supplierName = row[3]?.toString().trim() || '';
        const remark = row[4]?.toString().trim() || '';

        const material = await queryRunner.manager.findOne(Material, {
          where: { name: materialName },
        });
        if (!material)
          throw new BadRequestException(`物料 ${materialName} 不存在`);
        if (quantity <= 0)
          throw new BadRequestException(`物料 ${materialName} 数量必须大于0`);

        let supplierId: number | undefined;
        if (supplierName) {
          const supplier = await queryRunner.manager
            .getRepository(Supplier)
            .findOne({ where: { name: supplierName } });
          if (supplier) supplierId = supplier.id;
        }

        await queryRunner.manager.increment(
          Material,
          { id: material.id },
          'stock',
          quantity,
        );
        const inbound = queryRunner.manager.create(StockIn, {
          orderNo: `IN${Date.now()}_${i}`,
          materialId: material.id,
          quantity,
          unitPrice,
          supplierId,
          operatorId,
          remark,
        });
        await queryRunner.manager.save(inbound);
        results.push(inbound);
      }
      await queryRunner.commitTransaction();
      return { message: '导入成功', count: results.length };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
