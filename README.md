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

## Deploy lên Railway

Repo có sẵn `Dockerfile` ở thư mục gốc — build 1 image duy nhất: build client
(Vite) thành file tĩnh rồi để server Express serve luôn (1 service, 1 domain,
không cần cấu hình CORS).

1. Railway → **New Project** → **Deploy from GitHub repo** → chọn repo này.
   Railway tự nhận `Dockerfile` ở root, không cần chỉnh Root Directory.
2. **Thêm Volume** (Settings → Volumes) và mount vào `/data`. Bắt buộc — nếu
   không có Volume, mỗi lần redeploy Railway sẽ xoá sạch database SQLite và
   ảnh đã upload.
3. Khai báo biến môi trường (Settings → Variables):
   ```
   DATABASE_URL=file:/data/dev.db
   UPLOADS_DIR=/data/uploads
   JWT_SECRET=<chuỗi ngẫu nhiên mạnh, khác giá trị mẫu>
   ADMIN_SEED_USERNAME=admin
   ADMIN_SEED_PASSWORD=<mật khẩu admin thật, đổi khỏi admin123>
   ```
   Không cần khai báo `PORT` — Railway tự set và server đã đọc `process.env.PORT`.
4. Deploy xong, vào Settings → Networking → **Generate Domain** để có URL public.
5. Mỗi lần container khởi động sẽ tự chạy `prisma migrate deploy` rồi seed —
   seed chỉ tạo/ghi đè tài khoản admin (idempotent) và **chỉ** tạo danh sách
   tỉnh thành nếu database đang trống, nên an toàn khi redeploy nhiều lần và
   không xoá cấu hình ảnh ghép admin đã lưu.
6. Đăng nhập `/admin` bằng tài khoản ở bước 3, kiểm tra/sửa lại danh sách tỉnh
   thành (seed có thể sai sót, xem mục "Dữ liệu tỉnh thành"), rồi upload ảnh +
   gán lưới ở "Ảnh ghép".
