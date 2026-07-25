# Ghép Tỉnh Thành Việt Nam

Game web 2 màn chơi: (1) kéo-thả/bấm ghép các tỉnh cũ thành tỉnh mới, (2) ghép
34 mảnh ảnh đã cắt sẵn để tái tạo lại một bức ảnh gốc. Backend
Node/Express/TypeScript + Prisma/SQLite, frontend React/TypeScript/Vite.

## Cấu trúc

- `server/` — API Express, Prisma (SQLite), xác thực admin (JWT), cắt ảnh (sharp).
- `client/` — giao diện React (người chơi + trang quản trị `/admin`).

## Cài đặt lần đầu

```bash
npm run install:all      # cài deps cho cả server và client (từ thư mục gốc)
cp server/.env.example server/.env
cp client/.env.example client/.env
cd server
npx prisma migrate dev   # tạo database + chạy seed (admin + 63 tỉnh cũ -> 34 tỉnh mới)
cd ..
```

Tài khoản admin mặc định (từ seed, đổi trong `server/.env` trước khi seed nếu muốn):
`admin` / `admin123`.

## Chạy dev

```bash
npm run dev   # chạy song song server (http://localhost:4000) và client (http://localhost:5173)
```

## Dữ liệu tỉnh thành

`server/prisma/seed.ts` seed sẵn 63 tỉnh cũ gộp thành 34 tỉnh mới theo đợt sáp
nhập hành chính 2025 — dựng lại từ kiến thức huấn luyện của mô hình, **có thể
có sai sót**, nên đối chiếu lại và sửa qua `/admin` (`/admin/old-provinces`,
`/admin/new-provinces`) nếu cần.

## Luồng chơi

1. `/` — nhập tên, bắt đầu.
2. `/play/level1` — kéo một thẻ tỉnh cũ thả vào thẻ khác để ghép; nếu tỉnh đó
   không sáp nhập với tỉnh nào khác thì chỉ cần bấm vào thẻ. Ghép đúng sẽ có
   hoạt ảnh bay vào giữa màn hình, lật thẻ lộ ra mảnh ghép ảnh thật tương ứng,
   rồi bay lên khay ở đầu trang. Hết bảng là xong màn 1.
3. `/play/level2` — chọn 1 mảnh ghép rồi bấm vào ô lưới trống để đặt, ghép
   xong toàn bộ rồi bấm "Kiểm tra".
4. `/play/result` — hiện lại ảnh gốc hoàn chỉnh (chỉ khi ghép đúng), gửi điểm,
   xem bảng xếp hạng.

## Quản trị (`/admin`)

- Tỉnh cũ / Tỉnh mới: CRUD danh sách và quy tắc ghép.
- Ảnh ghép: tải 1 ảnh gốc, cấu hình lưới (số hàng/cột), gán mỗi tỉnh mới vào
  1 ô lưới — hệ thống tự cắt ảnh thành các mảnh tương ứng khi lưu.
- Bảng xếp hạng: xem/xoá điểm người chơi.

## Nút test tạm thời

Màn 1 có nút **"⏭ Skip (test)"** (viền vàng đứt nét) để bỏ qua toàn bộ màn 1
và nhảy thẳng sang màn 2 lúc đang phát triển/test. Nút này gọi một API debug
(`GET /api/game/debug/all-new-province-ids`) lộ toàn bộ id tỉnh mới — cần gỡ
bỏ cả nút lẫn API này (`server/src/routes/game.routes.ts`,
`server/src/controllers/game.controller.ts`, `client/src/pages/Level1.tsx`)
trước khi chia sẻ bản build cho người khác chơi.
