import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Danh sách 63 tỉnh/thành cũ gộp thành 34 tỉnh/thành mới theo đợt sáp nhập
// hành chính năm 2025, dựng lại từ kiến thức huấn luyện của mô hình — CÓ THỂ
// CÓ SAI SÓT so với Nghị quyết chính thức. Vui lòng đối chiếu và chỉnh sửa
// qua trang quản trị (/admin/old-provinces, /admin/new-provinces) nếu cần.
// Thứ tự liệt kê theo hướng Bắc -> Nam.
const REAL_GROUPS: { newName: string; oldNames: string[] }[] = [
  { newName: "Hà Nội", oldNames: ["Hà Nội"] },
  { newName: "Cao Bằng", oldNames: ["Cao Bằng"] },
  { newName: "Lạng Sơn", oldNames: ["Lạng Sơn"] },
  { newName: "Tuyên Quang", oldNames: ["Tuyên Quang", "Hà Giang"] },
  { newName: "Lào Cai", oldNames: ["Lào Cai", "Yên Bái"] },
  { newName: "Thái Nguyên", oldNames: ["Thái Nguyên", "Bắc Kạn"] },
  { newName: "Phú Thọ", oldNames: ["Phú Thọ", "Vĩnh Phúc", "Hòa Bình"] },
  { newName: "Bắc Ninh", oldNames: ["Bắc Ninh", "Bắc Giang"] },
  { newName: "Quảng Ninh", oldNames: ["Quảng Ninh"] },
  { newName: "Hải Phòng", oldNames: ["Hải Phòng", "Hải Dương"] },
  { newName: "Hưng Yên", oldNames: ["Hưng Yên", "Thái Bình"] },
  { newName: "Ninh Bình", oldNames: ["Ninh Bình", "Hà Nam", "Nam Định"] },
  { newName: "Thanh Hóa", oldNames: ["Thanh Hóa"] },
  { newName: "Nghệ An", oldNames: ["Nghệ An"] },
  { newName: "Hà Tĩnh", oldNames: ["Hà Tĩnh"] },
  { newName: "Quảng Trị", oldNames: ["Quảng Trị", "Quảng Bình"] },
  { newName: "Huế", oldNames: ["Huế"] },
  { newName: "Đà Nẵng", oldNames: ["Đà Nẵng", "Quảng Nam"] },
  { newName: "Quảng Ngãi", oldNames: ["Quảng Ngãi", "Kon Tum"] },
  { newName: "Gia Lai", oldNames: ["Gia Lai", "Bình Định"] },
  { newName: "Đắk Lắk", oldNames: ["Đắk Lắk", "Phú Yên"] },
  { newName: "Khánh Hòa", oldNames: ["Khánh Hòa", "Ninh Thuận"] },
  { newName: "Lâm Đồng", oldNames: ["Lâm Đồng", "Đắk Nông", "Bình Thuận"] },
  { newName: "Lai Châu", oldNames: ["Lai Châu"] },
  { newName: "Điện Biên", oldNames: ["Điện Biên"] },
  { newName: "Sơn La", oldNames: ["Sơn La"] },
  { newName: "Tây Ninh", oldNames: ["Tây Ninh", "Long An"] },
  { newName: "TP. Hồ Chí Minh", oldNames: ["TP. Hồ Chí Minh", "Bình Dương", "Bà Rịa - Vũng Tàu"] },
  { newName: "Đồng Nai", oldNames: ["Đồng Nai", "Bình Phước"] },
  { newName: "Đồng Tháp", oldNames: ["Đồng Tháp", "Tiền Giang"] },
  { newName: "Vĩnh Long", oldNames: ["Vĩnh Long", "Bến Tre", "Trà Vinh"] },
  { newName: "Cần Thơ", oldNames: ["Cần Thơ", "Sóc Trăng", "Hậu Giang"] },
  { newName: "An Giang", oldNames: ["An Giang", "Kiên Giang"] },
  { newName: "Cà Mau", oldNames: ["Cà Mau", "Bạc Liêu"] },
];

async function main() {
  const username = process.env.ADMIN_SEED_USERNAME || "admin";
  const password = process.env.ADMIN_SEED_PASSWORD || "admin123";
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.adminUser.upsert({
    where: { username },
    update: {},
    create: { username, passwordHash },
  });
  console.log(`Seeded admin user "${username}" (password: "${password}")`);

  // Chỉ seed tỉnh thành nếu database còn trống — script này chạy tự động mỗi
  // lần container khởi động (xem Dockerfile) nên KHÔNG được xoá/ghi đè dữ
  // liệu tỉnh thành hay gán ảnh ghép mà admin đã tự chỉnh sau lần seed đầu.
  const existingCount = await prisma.newProvince.count();
  if (existingCount > 0) {
    console.log(`Đã có ${existingCount} tỉnh mới trong database, bỏ qua seed tỉnh thành.`);
    return;
  }

  let order = 0;
  for (const group of REAL_GROUPS) {
    const newProvince = await prisma.newProvince.create({
      data: { name: group.newName, order: order++ },
    });

    let oldOrder = 0;
    for (const oldName of group.oldNames) {
      await prisma.oldProvince.create({
        data: { name: oldName, order: oldOrder++, newProvinceId: newProvince.id },
      });
    }
  }

  const totalOld = REAL_GROUPS.reduce((sum, g) => sum + g.oldNames.length, 0);
  console.log(`Seeded ${REAL_GROUPS.length} tỉnh mới từ ${totalOld} tỉnh cũ.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
