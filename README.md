# GradTrack — Backend API

Hệ thống đặt lịch gặp GVHD và theo dõi tiến độ đồ án tốt nghiệp (Group 5).
Spring Boot 4.1 · Java 17 · PostgreSQL 17 · Flyway · JWT · Google OAuth 2.0.

Tài liệu này là **hợp đồng làm việc giữa BE và FE**. FE chỉ cần đọc mục 1 → 8.

---

## Mục lục

1. [Trạng thái](#1-trạng-thái)
2. [Chạy BE ở máy local](#2-chạy-be-ở-máy-local)
3. [Tài khoản test có sẵn](#3-tài-khoản-test-có-sẵn)
4. [Quy ước API](#4-quy-ước-api)
5. [Đăng nhập & phiên làm việc](#5-đăng-nhập--phiên-làm-việc)
6. [Tích hợp theo FE Structure Guideline](#6-tích-hợp-theo-fe-structure-guideline)
7. [Danh sách API theo feature](#7-danh-sách-api-theo-feature)
8. [Quy tắc nghiệp vụ UI phải xử lý](#8-quy-tắc-nghiệp-vụ-ui-phải-xử-lý)
9. [Quy trình phối hợp BE ↔ FE](#9-quy-trình-phối-hợp-be--fe)
10. [Nhật ký thay đổi & ảnh hưởng](#10-nhật-ký-thay-đổi--ảnh-hưởng)
11. [Dành cho team BE](#11-dành-cho-team-be)
12. [Frontend: trạng thái tích hợp & việc cần team BE xử lý](#12-frontend-trạng-thái-tích-hợp--việc-cần-team-be-xử-lý)

---

## 1. Trạng thái

**Backend đã xong toàn bộ flow MVP theo Project Intent**, chạy trên dữ liệu thật trong PostgreSQL (Docker). **FE bỏ mock data, gọi API thật.**

| Nghiệp vụ (PDF) | Trạng thái |
|---|---|
| Đăng nhập Google OAuth 2.0 (mọi tài khoản Google admin đã thêm; email trường tự đăng ký), 4 role | ✅ (cần tạo Google OAuth Client: mục 5.7) |
| Đăng nhập email + mật khẩu; admin cấp/reset mật khẩu; người dùng tự đổi mật khẩu | ✅ (v1.1.0) |
| GV cấu hình lịch rảnh lặp hằng tuần (có buffer) → tự sinh slot | ✅ |
| SV đặt slot, tự xác nhận ngay, **khoá chống đặt trùng** (kể cả bấm cùng lúc) | ✅ |
| Huỷ / hoàn thành / vắng mặt / biên bản buổi gặp + lịch sử | ✅ |
| Email thông báo + đồng bộ Google Calendar (chạy nền, có retry) | ✅ (tắt mặc định ở dev, xem mục 10) |
| Milestone theo tuần + Kanban `TODO / IN_PROGRESS / REVIEW / DONE` | ✅ |
| Nộp link bài, gắn cờ nộp trễ, feedback + điểm 0–10 | ✅ |
| Dashboard giáo vụ khoa (% hoàn thành, nhóm chậm tiến độ) | ✅ |
| Quản trị: user, role, bộ môn, học kỳ, đồ án, thành viên nhóm | ✅ |
| Lưu trữ học kỳ (archive → chỉ đọc) | ✅ |

Đã kiểm thử end-to-end 45 kịch bản qua HTTP (đăng nhập, xoay vòng refresh token, đặt trùng đồng thời, phân quyền, kanban, nộp bài, dashboard…).

---

## 2. Chạy BE ở máy local

**Yêu cầu:** Docker Desktop, JDK 17+.

```bash
# 1. Tạo file môi trường (chỉ làm 1 lần) rồi điền giá trị (xem chú thích trong file)
cp .env.example .env
#    Bắt buộc: POSTGRES_PASSWORD, PGADMIN_DEFAULT_PASSWORD, APP_JWT_SECRET, APP_ENCRYPTION_KEY
#    Tạo secret:  openssl rand -base64 48   (JWT)   |   openssl rand -base64 32   (encryption key)

# 2. Bật database
docker compose up -d                    # chỉ PostgreSQL
docker compose --profile tools up -d    # + pgAdmin

# 3. Chạy backend (lần đầu Flyway tự tạo bảng + nạp dữ liệu mẫu)
./mvnw spring-boot:run                  # Windows: mvnw.cmd spring-boot:run
```

| Dịch vụ | Địa chỉ |
|---|---|
| API base URL | `http://localhost:8080/api/v1` |
| **Swagger UI** (thử API, xem schema) | http://localhost:8080/swagger-ui.html |
| OpenAPI JSON | http://localhost:8080/v3/api-docs |
| Health check | http://localhost:8080/actuator/health |
| PostgreSQL | `localhost:5433` — DB `gradtrackdb`, user `gradtrack`, mật khẩu trong `.env` |
| pgAdmin | http://localhost:5050 |

**Reset dữ liệu về trạng thái ban đầu:** `docker compose down -v && docker compose up -d`, rồi chạy lại BE.

---

## 3. Tài khoản test có sẵn

Profile `dev` tự nạp dữ liệu mẫu của học kỳ **FA26 (07/09 → 20/12/2026, đang ACTIVE)** và học kỳ **SU26 (đã lưu trữ)**.

**Mọi tài khoản dưới đây có mật khẩu `12345`.** Có 3 cách đăng nhập:

| Cách | API | Khi nào dùng |
|---|---|---|
| Email + mật khẩu | `POST /api/v1/auth/login` `{ "email": "...", "password": "12345" }` | Cách chính khi demo |
| Google | `POST /api/v1/auth/google` `{ "code": "..." }` | Cần Google OAuth Client (mục 5.7) |
| Dev login (không cần mật khẩu) | `POST /api/v1/auth/dev-login` `{ "email": "..." }` | Chỉ profile `dev`, để test nhanh |

| Role | Email | Ghi chú |
|---|---|---|
| ADMIN | `admin@fpt.edu.vn` | Lấy từ `APP_BOOTSTRAP_ADMIN_EMAIL` |
| DEPARTMENT_MANAGER | `giaovu.se@fpt.edu.vn` | Giáo vụ bộ môn SE (thấy 4 đồ án SE) |
| DEPARTMENT_MANAGER | `giaovu.ai@fpt.edu.vn` | Giáo vụ bộ môn AI |
| ADVISOR | `hoangnm@fpt.edu.vn` | GVHD nhóm SE01, SE02 · rảnh T3 9–11h, T5 14–16h |
| ADVISOR | `lantt@fpt.edu.vn` | GVHD nhóm SE03, SE04 · rảnh T4 13h30–16h30 (online) |
| ADVISOR | `quanlv@fpt.edu.vn` | GVHD nhóm AI01 · rảnh T6 8–10h |
| STUDENT | `anvse170001@fpt.edu.vn` | Trưởng nhóm SE01 (đúng tiến độ) |
| STUDENT | `duypdse170004@fpt.edu.vn` | Trưởng nhóm SE02 (**chậm tiến độ**, có bài nộp trễ) |
| STUDENT | `khoavmse170006@fpt.edu.vn` | Trưởng nhóm SE03 |
| STUDENT | `nhidnse170009@fpt.edu.vn` | Trưởng nhóm SE04 (**nguy cơ**, 3 milestone quá hạn) |
| STUDENT | `quanlhai170011@fpt.edu.vn` | Trưởng nhóm AI01 |
| STUDENT | `tungptai170013@fpt.edu.vn` | **Chưa có nhóm** (để test admin thêm thành viên) |

Ngoài ra còn các thành viên khác: `binhtbse170002`, `cucltse170003`, `hanhgse170005`, `linhdtse170007`, `minhbqse170008`, `phatntse170010`, `thumaai170012` (đều `@fpt.edu.vn`).

Dữ liệu có sẵn: 5 nhóm đồ án FA26, 210 slot, 9 lịch hẹn (đã hoàn thành / vắng mặt / huỷ / sắp tới), 40 milestone (tuần 1–8), 70 task, 43 bài nộp (6 bài trễ), 38 feedback có điểm.

> Email bất kỳ `@fpt.edu.vn` khác cũng dev-login (hoặc đăng nhập Google) được: hệ thống tự tạo tài khoản STUDENT **không có mật khẩu** (đúng luật first-login, mục 5.4). Tài khoản đó chỉ đăng nhập bằng mật khẩu được sau khi admin cấp mật khẩu.
>
> Trang test đăng nhập (mật khẩu + Google thật) có sẵn ở dev: http://localhost:8080/dev/google-login.html

---

## 4. Quy ước API

| Chủ đề | Quy ước |
|---|---|
| Base URL | `/api/v1` (mọi endpoint). Thay đổi phá vỡ tương thích → `/api/v2`. |
| Xác thực | Header `Authorization: Bearer <accessToken>` cho mọi API trừ `/auth/*` và `/meta/*` |
| Định dạng | JSON, UTF-8. Tên field **camelCase**. |
| ID | UUID dạng chuỗi |
| Thời điểm (`...At`) | ISO-8601 **UTC**, ví dụ `"2026-10-15T07:00:00Z"`. FE **hiển thị theo `Asia/Ho_Chi_Minh`**. Gửi lên cũng dùng ISO-8601 (có `Z` hoặc offset). |
| Ngày (`...Date`) | `"YYYY-MM-DD"` |
| Giờ trong ngày (lịch rảnh) | `"HH:mm"`, theo giờ Việt Nam |
| Enum | Chuỗi IN HOA (`"IN_PROGRESS"`). Danh sách + nhãn tiếng Việt: `GET /meta/enums` |
| Thành công | Trả thẳng object / mảng. Tạo mới → `201`. Xoá → `204` (không có body). |
| Phân trang | Query: `page` (từ 0), `size` (mặc định 20), `sort=field,asc|desc`. Response dạng `PageResponse` bên dưới. |

**`PageResponse`**

```json
{ "content": [ ... ], "page": 0, "size": 20, "totalElements": 57, "totalPages": 3 }
```

**Lỗi — luôn cùng một format (RFC 7807, `application/problem+json`):**

```json
{
  "type": "about:blank",
  "title": "Conflict",
  "status": 409,
  "detail": "Slot vừa có nhóm khác đặt, vui lòng chọn slot khác",
  "instance": "/api/v1/bookings",
  "code": "SLOT_ALREADY_BOOKED",
  "timestamp": "2026-10-12T11:13:44.551Z",
  "errors": [ { "field": "url", "message": "phải bắt đầu bằng http:// hoặc https://" } ]
}
```

- **FE rẽ nhánh theo `code`, KHÔNG theo `detail`.** `detail` là câu tiếng Việt, có thể hiển thị thẳng cho người dùng (toast).
- `errors[]` chỉ có khi `code = VALIDATION_FAILED` → gắn lỗi vào từng ô input theo `field`.
- Danh sách đầy đủ mã lỗi: `GET /meta/error-codes`. Các mã FE cần xử lý riêng:

| `code` | HTTP | FE nên làm gì |
|---|---|---|
| `UNAUTHORIZED` | 401 | Interceptor tự refresh token; refresh hỏng → về trang đăng nhập |
| `AUTH_REFRESH_TOKEN_INVALID` | 401 | Xoá token, về trang đăng nhập |
| `AUTH_INVALID_CREDENTIALS` | 401 | Form đăng nhập: "Email hoặc mật khẩu không đúng" (**không** gọi refresh) |
| `PASSWORD_POLICY_VIOLATION` | 400 | Hiện `detail` dưới ô mật khẩu mới |
| `PASSWORD_INCORRECT` / `PASSWORD_SAME_AS_OLD` | 400 | Form đổi mật khẩu: báo lỗi ở ô tương ứng |
| `PASSWORD_NOT_SET` | 409 | Tài khoản chỉ dùng Google: ẩn chức năng đổi mật khẩu (`user.hasPassword = false`) |
| `AUTH_ACCOUNT_NOT_REGISTERED` | 403 | Đăng nhập Google bằng email chưa được admin thêm: "Email này chưa được cấp quyền, liên hệ admin" |
| `AUTH_EMAIL_DOMAIN_NOT_ALLOWED` | 403 | **Không còn được trả về từ v1.2.0** (giữ để tương thích) |
| `AUTH_ACCOUNT_DISABLED` | 403 | Thông báo tài khoản bị khoá |
| `FORBIDDEN` | 403 | Toast "không có quyền" |
| `SLOT_ALREADY_BOOKED` / `SLOT_NOT_AVAILABLE` | 409 | Toast + **tải lại danh sách slot** |
| `CONCURRENT_MODIFICATION` | 409 | Dữ liệu vừa bị người khác sửa → tải lại |
| `TERM_ARCHIVED` / `TERM_NOT_ACTIVE` | 409 | Chuyển màn hình sang chế độ chỉ đọc |
| `VALIDATION_FAILED` | 400 | Hiển thị `errors[]` dưới từng ô |
| `NO_ACTIVE_TERM` | 404 | Màn hình trống "Chưa có học kỳ đang hoạt động" |

> Thông điệp trong `errors[].message` lấy từ Bean Validation, một số câu mặc định đang là tiếng Anh (vd. `must not be blank`). FE nên dùng thông điệp riêng cho các lỗi phổ biến (required, max length) và chỉ fallback về `message`.

---

## 5. Đăng nhập & phiên làm việc

### 5.1 Token

| Token | Thời hạn | Lưu ở FE | Dùng để |
|---|---|---|---|
| `accessToken` (JWT) | 30 phút | bộ nhớ / `localStorage` | Header `Authorization: Bearer …` |
| `refreshToken` | 14 ngày, **dùng 1 lần** | `localStorage` | `POST /auth/refresh` lấy cặp token mới |

**Xoay vòng refresh token:** mỗi lần refresh, token cũ bị thu hồi và BE trả token mới. **Nếu một refresh token cũ bị dùng lại, BE thu hồi toàn bộ phiên của user đó** (chống đánh cắp). Vì vậy FE phải đảm bảo **chỉ một request refresh chạy tại một thời điểm**; code mẫu ở mục 6.2 đã xử lý việc này.

### 5.2 Response chung của login / refresh — `AuthResponse`

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
  "tokenType": "Bearer",
  "expiresIn": 1800,
  "refreshToken": "kq3x...",
  "refreshExpiresIn": 1209600,
  "user": {
    "id": "20000000-0000-0000-0000-000000000101",
    "email": "anvse170001@fpt.edu.vn",
    "fullName": "Nguyễn Văn An",
    "avatarUrl": null,
    "userCode": "SE170001",
    "role": "STUDENT",
    "roleLabel": "Sinh viên",
    "department": { "id": "…", "code": "SE", "name": "Kỹ thuật phần mềm" },
    "permissions": ["BOOKING_CANCEL", "BOOKING_CREATE", "BOOKING_VIEW", "PROJECT_VIEW", "SLOT_VIEW", "SUBMISSION_CREATE", "TASK_EDIT"],
    "googleCalendarConnected": false,
    "hasPassword": true
  }
}
```

`GET /auth/me` trả đúng object `user` ở trên. Gọi khi reload trang để khôi phục phiên.
`hasPassword = false` nghĩa là tài khoản chỉ đăng nhập bằng Google: ẩn mục "Đổi mật khẩu".

### 5.3 Đăng nhập Google — Google Identity Services, code flow

1. Lấy `googleClientId` từ `GET /meta/config` (hoặc `VITE_GOOGLE_CLIENT_ID`). Nếu `googleLoginEnabled = false` thì BE chưa cấu hình Google (mục 5.7): ẩn nút Google, chỉ hiện form mật khẩu.
2. FE mở popup xin **authorization code** (không phải ID token), kèm scope Calendar để BE đồng bộ lịch hẹn:

```jsx
// features/auth/components/GoogleLoginButton.jsx  (npm i @react-oauth/google)
import { useGoogleLogin } from "@react-oauth/google";
import { loginWithGoogle } from "../auth.service";

export default function GoogleLoginButton({ onSuccess, onError }) {
  const login = useGoogleLogin({
    flow: "auth-code",
    scope: "openid email profile https://www.googleapis.com/auth/calendar.events",
    onSuccess: ({ code }) => loginWithGoogle(code).then(onSuccess).catch(onError),
    onError,
  });
  return <button onClick={() => login()}>Đăng nhập bằng Google (@fpt.edu.vn)</button>;
}
```

3. `POST /auth/google` với body `{ "code": "<code>" }` → nhận `AuthResponse`.

Origin của FE (vd. `http://localhost:3000`) phải nằm trong **Authorized JavaScript origins** của OAuth client. BE dùng `redirect_uri = postmessage`, không cần khai báo redirect URI. Cách tạo OAuth client: mục 5.7.

### 5.4 Ai được đăng nhập bằng Google (v1.2.0)

**Mọi tài khoản Google đều đăng nhập được, không phân biệt đuôi email, miễn là email đó có trong hệ thống.** Danh sách tài khoản do admin quản lý chính là danh sách được phép đăng nhập.

| Tình huống khi đăng nhập Google | Kết quả |
|---|---|
| Email đã được admin thêm (`POST /users`), bất kỳ domain nào: `@gmail.com`, `@fpt.edu.vn`… | Đăng nhập với **đúng role admin đã gán**; lần đầu thì liên kết tài khoản Google |
| Email chưa có, thuộc domain tự đăng ký (`APP_AUTO_REGISTER_EMAIL_DOMAINS`, mặc định `fpt.edu.vn`) | **Tự tạo tài khoản `STUDENT`, không có mật khẩu** (luật first-login của PDF dành cho sinh viên) |
| Email chưa có, domain khác (vd. Gmail cá nhân) | `403 AUTH_ACCOUNT_NOT_REGISTERED`: cần admin thêm email trước |
| Google báo email chưa xác minh | `403 AUTH_EMAIL_NOT_VERIFIED` |
| Tài khoản bị admin vô hiệu hoá | `403 AUTH_ACCOUNT_DISABLED` |

- Muốn **chỉ** những người admin đã thêm mới vào được (không cho sinh viên tự đăng ký), đặt `APP_AUTO_REGISTER_EMAIL_DOMAINS=` (để trống) trong `.env` của BE.
- FE **không được** tự chặn đăng nhập theo đuôi email nữa: cứ gửi lên, BE quyết định.

→ Quy trình vận hành: Admin **thêm email** của GV, giáo vụ, hoặc người dùng Gmail (`POST /users`, mật khẩu tuỳ chọn), hoặc đổi role sau khi họ đăng nhập lần đầu (`PUT /users/{id}`). Role mới có hiệu lực ở lần refresh token kế tiếp (tối đa 30 phút) hoặc khi đăng nhập lại.

**Đăng nhập bằng mật khẩu không bao giờ tự tạo tài khoản**: email chưa có trong hệ thống, tài khoản chỉ dùng Google, hay sai mật khẩu đều trả cùng một lỗi `401 AUTH_INVALID_CREDENTIALS`, để không lộ email nào đang tồn tại.

### 5.4a Mật khẩu (v1.1.0)

| Việc | API | Ai | Ghi chú |
|---|---|---|---|
| Đăng nhập | `POST /auth/login` `{ email, password }` | Tài khoản admin đã tạo và có mật khẩu (mọi domain) | → `AuthResponse` (giống Google). Không tự tạo tài khoản. |
| Tự đổi mật khẩu | `POST /auth/change-password` `{ currentPassword, newPassword }` | Người đã đăng nhập, có mật khẩu | → `AuthResponse` **mới**: FE lưu đè token. Các phiên khác bị đăng xuất. |
| Thêm tài khoản / cấp quyền đăng nhập Google | `POST /users` (`password` **tuỳ chọn** từ v1.2.0) | Admin (`USER_MANAGE`) | Có `password` → đăng nhập được cả 2 cách; bỏ trống → chỉ Google |
| Cấp / reset mật khẩu | `PUT /users/{id}/password` `{ newPassword }` | Admin (`USER_MANAGE`) | Người đó bị đăng xuất khỏi mọi phiên |

- **Quy tắc mật khẩu mới:** tối thiểu 8 ký tự, có cả chữ và số, không có khoảng trắng. FE đọc `passwordMinLength` và `passwordRule` từ `GET /meta/config` để validate trên form và hiển thị gợi ý, không gõ cứng.
- **Tài khoản có từ trước** (kể cả dữ liệu mẫu) có mật khẩu mặc định `12345`. Mật khẩu này không theo quy tắc mới, nên đây là lý do để người dùng tự đổi sau khi đăng nhập.
- Mật khẩu chỉ lưu dạng băm BCrypt; API **không bao giờ** trả mật khẩu hay hash. `UserResponse` (admin) có `hasPassword` và `passwordChangedAt`.
- Không có "quên mật khẩu" qua email: người dùng nhờ admin reset.

### 5.5 Dev login (chỉ profile `dev`)

`POST /auth/dev-login` `{ "email": "anvse170001@fpt.edu.vn" }` → `AuthResponse`. Endpoint này **không tồn tại** trên production. FE hiển thị form dev-login khi `GET /meta/config` trả `devLoginEnabled: true`.

### 5.6 Đăng xuất

`POST /auth/logout` `{ "refreshToken": "…" }` → `204`, rồi FE xoá token đã lưu.

### 5.7 Thiết lập đăng nhập Google thật (làm 1 lần, khoảng 10 phút)

**B1. Tạo project và màn hình xin quyền**
1. Vào https://console.cloud.google.com, tạo project (vd. `GradTrack`).
2. **APIs & Services → Library**: bật **Google Calendar API** (dùng cho đồng bộ lịch hẹn).
3. **APIs & Services → OAuth consent screen** (hoặc *Google Auth Platform → Branding / Audience*):
   - User type: **External** · App name: `GradTrack` · điền email hỗ trợ.
   - **Scopes**: `openid`, `.../auth/userinfo.email`, `.../auth/userinfo.profile`, `.../auth/calendar.events`.
   - Publishing status: để **Testing**, rồi thêm các email sẽ dùng để test vào **Test users** (tối đa 100).

**B2. Tạo OAuth Client ID**
1. **APIs & Services → Credentials → Create credentials → OAuth client ID** → loại **Web application**.
2. **Authorized JavaScript origins**: thêm
   - `http://localhost:8080` (trang test của BE)
   - `http://localhost:3000` và/hoặc `http://localhost:5173` (FE)
3. **Authorized redirect URIs**: để trống (dùng popup `postmessage`).
4. Copy **Client ID** và **Client secret**.

**B3. Điền vào `.env` của BE rồi khởi động lại BE**
```properties
GOOGLE_CLIENT_ID=xxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxx
GOOGLE_REDIRECT_URI=postmessage
```
FE đặt `VITE_GOOGLE_CLIENT_ID` bằng cùng Client ID. **Không commit** Client secret (`.env` đã nằm trong `.gitignore`).

**B4. Kiểm tra:** mở http://localhost:8080/dev/google-login.html, bấm *Đăng nhập bằng Google*. Thành công thì khung kết quả hiện `AuthResponse`.

**Lỗi thường gặp**

| Lỗi | Cách xử lý |
|---|---|
| `Error 400: origin_mismatch` / `redirect_uri_mismatch` | Origin trang đang mở chưa có trong *Authorized JavaScript origins* (phân biệt `localhost` và `127.0.0.1`). Thêm xong đợi vài phút. |
| `Error 403: access_denied` | Email chưa có trong **Test users** |
| "Google hasn't verified this app" | Bình thường ở chế độ Testing: bấm *Advanced → Go to GradTrack (unsafe)* |
| "Access blocked: … your organization's admin" | Google Workspace của trường chặn app bên ngoài. Dùng Gmail cá nhân: admin thêm email Gmail đó (`POST /users`) và thêm nó vào **Test users** trong Google Console |
| `403 AUTH_ACCOUNT_NOT_REGISTERED` | Email chưa được admin thêm vào hệ thống (và không thuộc domain tự đăng ký) |
| `503 AUTH_GOOGLE_NOT_CONFIGURED` | BE chưa có `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` |

Đồng bộ Google Calendar cần thêm `APP_CALENDAR_SYNC_ENABLED=true`. Lịch được tạo trên Calendar **của GV**, nên GV phải đăng nhập Google ít nhất một lần và đồng ý quyền Calendar (`googleCalendarConnected = true` trong `/auth/me`).

---

## 6. Tích hợp theo FE Structure Guideline

Luồng gọi API đúng guideline: **Component → `feature.service.js` → `services/apiClient.js` → Backend**.

### 6.1 Biến môi trường FE (`.env` của project FE)

```properties
VITE_API_URL=http://localhost:8080/api/v1
VITE_GOOGLE_CLIENT_ID=<cùng giá trị GOOGLE_CLIENT_ID của BE>
```

BE cho phép CORS từ `http://localhost:5173` (Vite mặc định) và `http://localhost:3000`. FE chạy ở cổng khác thì thêm vào `APP_CORS_ALLOWED_ORIGINS` trong `.env` của BE (phân tách bằng dấu phẩy), **và** thêm cùng origin đó vào *Authorized JavaScript origins* của Google OAuth client. Thiếu một trong hai là đăng nhập Google hỏng: thiếu CORS thì trình duyệt chặn request với lỗi CORS; thiếu origin Google thì popup báo `origin_mismatch`.

### 6.2 `src/services/apiClient.js`: axios, interceptor, refresh, lỗi chuẩn hoá

```js
import axios from "axios";

const TOKEN_KEY = "gt.accessToken";
const REFRESH_KEY = "gt.refreshToken";

export const tokenStore = {
  get access() { return localStorage.getItem(TOKEN_KEY); },
  get refresh() { return localStorage.getItem(REFRESH_KEY); },
  save({ accessToken, refreshToken }) {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);
  },
  clear() { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(REFRESH_KEY); },
};

const apiClient = axios.create({ baseURL: import.meta.env.VITE_API_URL });

apiClient.interceptors.request.use((config) => {
  if (tokenStore.access) config.headers.Authorization = `Bearer ${tokenStore.access}`;
  return config;
});

// Only ONE refresh in flight (refresh tokens are single-use, reuse revokes the session)
let refreshing = null;
async function refreshTokens() {
  refreshing ??= axios
    .post(`${import.meta.env.VITE_API_URL}/auth/refresh`, { refreshToken: tokenStore.refresh })
    .then(({ data }) => { tokenStore.save(data); return data.accessToken; })
    .finally(() => { refreshing = null; });
  return refreshing;
}

// Public auth calls: a 401 here means "wrong credentials / expired session", never "refresh and retry".
// (/auth/me and /auth/change-password are NOT in this list: they use the access token like any API.)
const PUBLIC_AUTH = ["/auth/login", "/auth/google", "/auth/dev-login", "/auth/refresh", "/auth/logout"];

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { config, response } = error;
    const isPublicAuthCall = PUBLIC_AUTH.some((p) => config?.url?.startsWith(p));
    if (response?.status === 401 && !config._retried && !isPublicAuthCall && tokenStore.refresh) {
      config._retried = true;
      try {
        const token = await refreshTokens();
        config.headers.Authorization = `Bearer ${token}`;
        return apiClient(config);
      } catch {
        tokenStore.clear();
        window.location.assign("/login");
      }
    }
    // Normalised error for every feature: { status, code, message, fieldErrors }
    const body = response?.data ?? {};
    return Promise.reject({
      status: response?.status ?? 0,
      code: body.code ?? "NETWORK_ERROR",
      message: body.detail ?? "Không kết nối được máy chủ",
      fieldErrors: Object.fromEntries((body.errors ?? []).map((e) => [e.field, e.message])),
    });
  },
);

export default apiClient;
```

### 6.3 Không hardcode role: dùng `permissions`

Guideline cấm hardcode role trong component. BE trả `user.permissions` và **chính BE cũng kiểm tra quyền bằng đúng các permission này**, nên FE chỉ cần:

```js
// src/hooks/useAuth.js (rút gọn)
export function useAuth() {
  const { user } = useContext(AuthContext);
  const can = (permission) => !!user?.permissions?.includes(permission);
  return { user, can };
}

// Trong component
const { can } = useAuth();
{can("BOOKING_CREATE") && <BookSlotButton slot={slot} />}
```

| Permission | STUDENT | ADVISOR | DEPT_MANAGER | ADMIN | Dùng cho UI |
|---|:-:|:-:|:-:|:-:|---|
| `PROJECT_VIEW` | ✓ | ✓ | ✓ | ✓ | Xem đồ án, milestone, kanban, bài nộp |
| `SLOT_VIEW` / `BOOKING_VIEW` | ✓ | ✓ | ✓ | ✓ | Xem lịch |
| `BOOKING_CREATE` | ✓ | | | | Nút "Đặt lịch" |
| `BOOKING_CANCEL` | ✓ | ✓ | | | Nút "Huỷ lịch" |
| `BOOKING_MANAGE` | | ✓ | | | Hoàn thành / Vắng mặt / Biên bản |
| `AVAILABILITY_MANAGE` | | ✓ | | | Cấu hình lịch rảnh, tạo/huỷ slot |
| `MILESTONE_MANAGE` | | ✓ | | | Tạo/sửa/xoá milestone |
| `TASK_EDIT` | ✓ | ✓ | | | Tạo/sửa/kéo thả task |
| `SUBMISSION_CREATE` | ✓ | | | | Nộp link bài |
| `FEEDBACK_CREATE` | | ✓ | | | Nhận xét + chấm điểm |
| `DASHBOARD_VIEW` | | ✓ | ✓ | ✓ | Dashboard tiến độ |
| `USER_MANAGE`, `DEPARTMENT_MANAGE`, `TERM_MANAGE`, `PROJECT_MANAGE` | | | | ✓ | Màn hình quản trị (gồm cấp/reset mật khẩu) |

Mục **"Đổi mật khẩu"** không cần permission: hiện cho mọi người đã đăng nhập khi `user.hasPassword === true`.

Ngoài permission, BE còn kiểm tra **quyền theo dữ liệu**: SV chỉ thấy nhóm mình, GV chỉ thấy nhóm mình hướng dẫn, giáo vụ chỉ thấy bộ môn mình. FE không cần lọc lại.

### 6.4 Enum & nhãn: không hardcode

Gọi **một lần khi app khởi động** rồi lưu vào context/store:

- `GET /meta/enums` → `{ "taskStatus": [{ "value": "TODO", "label": "Cần làm" }, …], "bookingStatus": [...], … }`
- `GET /meta/config` → `{ timeZone, defaultSlotDurationMinutes, defaultBufferMinutes, googleLoginEnabled, googleClientId, devLoginEnabled, emailEnabled, calendarSyncEnabled, passwordLoginEnabled, passwordMinLength, passwordRule, autoRegisterEmailDomains }`. Field cũ `allowedEmailDomains` vẫn còn nhưng **đã ngừng dùng**: không dùng nó để chặn email ở form đăng nhập.

Trang đăng nhập dựa vào config này: luôn có form email + mật khẩu (`passwordLoginEnabled`), có nút Google khi `googleLoginEnabled`, và có ô dev-login khi `devLoginEnabled`.

`constants/` của FE chỉ còn giữ các key (vd. `TASK_COLUMNS = ["TODO","IN_PROGRESS","REVIEW","DONE"]`); nhãn hiển thị lấy từ API.

### 6.5 Bản đồ `features/` ↔ API

| Feature FE | File service | Endpoint chính |
|---|---|---|
| `features/auth` | `auth.service.js` | `/auth/*` (login, Google, đổi mật khẩu, me, logout), `/meta/*` |
| `features/booking` | `booking.service.js` | `/slots`, `/bookings/*` |
| `features/availability` (GV) | `availability.service.js` | `/availability/rules/*`, `POST /slots`, `/slots/{id}/cancel` |
| `features/project` | `project.service.js` | `/projects/*` |
| `features/kanban` | `kanban.service.js` | `/projects/{id}/milestones`, `/milestones/*`, `/tasks/*` |
| `features/submission` | `submission.service.js` | `/tasks/{id}/submissions`, `/projects/{id}/submissions`, `/submissions/{id}/feedbacks` |
| `features/dashboard` | `dashboard.service.js` | `/dashboard/*` |
| `features/admin` | `admin.service.js` | `/users/*` (gồm `PUT /users/{id}/password`), `/departments/*`, `/terms/*`, `/projects` (POST/PUT/members) |

Ví dụ service đúng guideline:

```js
// features/auth/auth.service.js
import apiClient, { tokenStore } from "@/services/apiClient";

const saveSession = ({ data }) => { tokenStore.save(data); return data.user; };

export const loginWithPassword = (email, password) =>
  apiClient.post("/auth/login", { email, password }).then(saveSession);

export const loginWithGoogle = (code) =>
  apiClient.post("/auth/google", { code }).then(saveSession);

export const changePassword = (currentPassword, newPassword) =>   // returns a NEW token pair
  apiClient.post("/auth/change-password", { currentPassword, newPassword }).then(saveSession);

export const getMe = () => apiClient.get("/auth/me").then((r) => r.data);

export const logout = () =>
  apiClient.post("/auth/logout", { refreshToken: tokenStore.refresh }).finally(() => tokenStore.clear());
```

```jsx
// features/auth/pages/LoginPage.jsx (trích)
try {
  const user = await loginWithPassword(email, password);
  navigate("/");
} catch (err) {
  // AUTH_INVALID_CREDENTIALS, AUTH_ACCOUNT_DISABLED, VALIDATION_FAILED (Google: AUTH_ACCOUNT_NOT_REGISTERED)
  setError(err.message);
}
```

```js
// features/booking/booking.service.js
import apiClient from "@/services/apiClient";

export const getOpenSlots = (params) =>            // { from, to } ISO strings, optional
  apiClient.get("/slots", { params: { status: "OPEN", ...params } }).then((r) => r.data);

export const createBooking = (slotId, agenda) =>
  apiClient.post("/bookings", { slotId, agenda }).then((r) => r.data);

export const cancelBooking = (id, reason) =>
  apiClient.post(`/bookings/${id}/cancel`, { reason }).then((r) => r.data);
```

```jsx
// features/booking/pages/BookingPage.jsx (trích)
try {
  await createBooking(slot.id, agenda);
  toast.success("Đặt lịch thành công");
} catch (err) {
  if (err.code === "SLOT_ALREADY_BOOKED") reloadSlots();
  toast.error(err.message);
}
```

> **Muốn sinh code tự động?** OpenAPI ở `/v3/api-docs` dùng được với `openapi-typescript` / `orval` nếu team chuyển sang TS. Swagger UI luôn là nguồn tra cứu chính xác nhất cho field của request/response.

---

## 7. Danh sách API theo feature

Ký hiệu quyền: 🔓 public · 👤 mọi user đã đăng nhập · còn lại là permission cần có.
Chi tiết schema từng field: **Swagger UI**.

### 7.1 Auth & Meta

| Method | Path | Quyền | Mô tả |
|---|---|---|---|
| POST | `/auth/login` | 🔓 | `{ email, password }` → `AuthResponse` |
| POST | `/auth/google` | 🔓 | `{ code }` → `AuthResponse` |
| POST | `/auth/dev-login` | 🔓 (chỉ dev) | `{ email }` → `AuthResponse` |
| POST | `/auth/change-password` | 👤 | `{ currentPassword, newPassword }` → `AuthResponse` mới (phiên khác bị đăng xuất) |
| POST | `/auth/refresh` | 🔓 | `{ refreshToken }` → `AuthResponse` mới |
| POST | `/auth/logout` | 🔓 | `{ refreshToken }` → 204 |
| GET | `/auth/me` | 👤 | Hồ sơ + `permissions` |
| GET | `/meta/enums` · `/meta/config` · `/meta/error-codes` | 🔓 | Enum + nhãn, cấu hình, mã lỗi |

### 7.2 Học kỳ, bộ môn, người dùng (quản trị)

| Method | Path | Quyền | Mô tả |
|---|---|---|---|
| GET | `/terms` · `/terms/active` · `/terms/{id}` | 👤 | Danh sách / học kỳ đang hoạt động |
| POST · PUT | `/terms` · `/terms/{id}` | `TERM_MANAGE` | `{ code, name, startDate, endDate }` |
| POST | `/terms/{id}/activate` | `TERM_MANAGE` | UPCOMING → ACTIVE (chỉ 1 kỳ ACTIVE) |
| POST | `/terms/{id}/archive` | `TERM_MANAGE` | → ARCHIVED: chỉ đọc; huỷ slot trống + lịch hẹn sắp tới |
| GET | `/departments` | 👤 | |
| POST · PUT | `/departments` · `/departments/{id}` | `DEPARTMENT_MANAGE` | `{ code, name }` |
| GET | `/users?q=&role=&departmentId=&active=&unassigned=&termId=&page=&size=&sort=` | `USER_MANAGE` | Tìm theo email/tên/mã. `unassigned=true`: chỉ **sinh viên chưa thuộc nhóm nào** trong học kỳ `termId` (mặc định học kỳ ACTIVE) |
| GET | `/users/{id}` | `USER_MANAGE` | |
| POST | `/users` | `USER_MANAGE` | Thêm tài khoản `{ email, fullName, userCode?, role, departmentId?, password? }`: email **mọi domain**; thêm email là cho phép người đó đăng nhập Google; `password` tuỳ chọn (theo quy tắc mục 5.4a) |
| PUT | `/users/{id}` | `USER_MANAGE` | `{ fullName, userCode?, role, departmentId?, active }` (không tự hạ quyền/khoá chính mình) |
| PUT | `/users/{id}/password` | `USER_MANAGE` | `{ newPassword }`: cấp / reset mật khẩu, người đó bị đăng xuất mọi phiên |

`UserResponse` có thêm `hasPassword`, `passwordChangedAt` và `googleLinked` (đã từng đăng nhập Google chưa); không bao giờ có mật khẩu hay hash.

### 7.3 Đồ án & nhóm

| Method | Path | Quyền | Mô tả |
|---|---|---|---|
| GET | `/projects?termId=&departmentId=&advisorId=&status=&q=&page=&size=&sort=` | `PROJECT_VIEW` | Đã lọc theo phạm vi role |
| GET | `/projects/mine` | `PROJECT_VIEW` | SV: nhóm của mình · GV: các nhóm mình hướng dẫn (học kỳ ACTIVE) |
| GET | `/projects/{id}` | `PROJECT_VIEW` | Kèm `members[]` (`leader: true` = trưởng nhóm) |
| POST | `/projects` | `PROJECT_MANAGE` | `{ termId, departmentId, advisorId, code, title, description? }` |
| PUT | `/projects/{id}` | `PROJECT_MANAGE` | `{ departmentId, advisorId, title, description?, status }` |
| POST | `/projects/{id}/members` | `PROJECT_MANAGE` | `{ studentId, leader? }` (thành viên đầu tiên tự thành trưởng nhóm) |
| PUT | `/projects/{id}/members/{studentId}/leader` | `PROJECT_MANAGE` | Đổi trưởng nhóm |
| DELETE | `/projects/{id}/members/{studentId}` | `PROJECT_MANAGE` | Trả về project đã cập nhật |

### 7.4 Lịch rảnh & slot

| Method | Path | Quyền | Mô tả |
|---|---|---|---|
| GET | `/availability/rules?termId=` | `AVAILABILITY_MANAGE` | Lịch rảnh hằng tuần của GV đang đăng nhập |
| POST | `/availability/rules` | `AVAILABILITY_MANAGE` | Tạo rule + **tự sinh slot** → `{ rule, generatedSlots, skippedSlots }` |
| POST | `/availability/rules/{id}/deactivate` | `AVAILABILITY_MANAGE` | Tắt rule, huỷ slot trống tương lai (slot đã đặt giữ nguyên) |
| GET | `/slots?advisorId=&from=&to=&status=OPEN,BOOKED` | `SLOT_VIEW` | Mặc định `from = now`, `to = from + 28 ngày`, tối đa 92 ngày |
| POST | `/slots` | `AVAILABILITY_MANAGE` | Slot lẻ `{ startAt, endAt, location?, meetingUrl? }` |
| POST | `/slots/{id}/cancel` | `AVAILABILITY_MANAGE` | `{ reason }`, bắt buộc nếu slot đã có nhóm đặt |

Body tạo rule:

```json
{ "dayOfWeek": 4, "startTime": "14:00", "endTime": "16:00",
  "slotDurationMinutes": 30, "bufferMinutes": 10,
  "location": "Phòng 304 - Toà Alpha", "meetingUrl": null,
  "effectiveFrom": "2026-10-12", "effectiveTo": "2026-12-20" }
```

`dayOfWeek`: 1 = Thứ 2 … 7 = Chủ nhật. `termId`, `slotDurationMinutes`, `bufferMinutes`, `effectiveFrom/To` có thể bỏ trống: mặc định là học kỳ ACTIVE, 30 phút, 0 phút và toàn bộ học kỳ.

`SlotResponse`:

```json
{ "id": "…", "advisor": { "id": "…", "fullName": "Nguyễn Minh Hoàng", "email": "…", "userCode": "GV001", "avatarUrl": null },
  "termId": "…", "ruleId": "…", "startAt": "2026-10-15T07:00:00Z", "endAt": "2026-10-15T07:30:00Z",
  "durationMinutes": 30, "status": "BOOKED", "location": "Phòng 304 - Toà Alpha", "meetingUrl": null,
  "booking": { "bookingId": "…", "project": { "id": "…", "code": "SE01", "title": "…" } } }
```

`booking` chỉ có giá trị với GV/giáo vụ/admin, hoặc với SV khi slot do chính nhóm họ đặt. SV nhóm khác thấy `null`.

### 7.5 Lịch hẹn (booking)

| Method | Path | Quyền | Mô tả |
|---|---|---|---|
| POST | `/bookings` | `BOOKING_CREATE` | `{ slotId, agenda? }` → **201 CONFIRMED ngay** |
| GET | `/bookings?status=&projectId=&from=&to=&page=&size=&sort=slot.startAt,desc` | `BOOKING_VIEW` | Theo phạm vi role |
| GET | `/bookings/{id}` | `BOOKING_VIEW` | `{ booking, history[] }` |
| POST | `/bookings/{id}/cancel` | `BOOKING_CANCEL` | `{ reason }` bắt buộc, chỉ trước giờ bắt đầu |
| POST | `/bookings/{id}/complete` | `BOOKING_MANAGE` | `{ meetingNotes? }`, chỉ sau giờ bắt đầu |
| POST | `/bookings/{id}/no-show` | `BOOKING_MANAGE` | `{ note? }`, chỉ sau giờ bắt đầu |
| PUT | `/bookings/{id}/notes` | `BOOKING_MANAGE` | `{ meetingNotes }` (biên bản buổi gặp) |

`BookingResponse`: `id, status, slot{id,startAt,endAt,location,meetingUrl}, advisor, project{id,code,title}, bookedBy, agenda, meetingNotes, cancelledBy, cancelledAt, cancellationReason, calendarSyncStatus, createdAt`.

### 7.6 Milestone, Kanban, bài nộp, feedback

| Method | Path | Quyền | Mô tả |
|---|---|---|---|
| GET | `/projects/{projectId}/milestones` | `PROJECT_VIEW` | Kèm `taskCounts{TODO,IN_PROGRESS,REVIEW,DONE}`, `totalTasks`, `overdue` |
| GET | `/milestones/{id}` | `PROJECT_VIEW` | |
| POST | `/projects/{projectId}/milestones` | `MILESTONE_MANAGE` | `{ weekNumber, title, description?, startDate, dueAt }` |
| POST | `/projects/{projectId}/milestones/generate` | `MILESTONE_MANAGE` | `{ firstWeekStart, weeks, dueTime? }` → tạo "Tuần 1..N" (hạn: Chủ nhật 23:59), bỏ qua tuần đã có |
| PUT · DELETE | `/milestones/{id}` | `MILESTONE_MANAGE` | Không xoá được nếu đã có bài nộp |
| GET | `/milestones/{milestoneId}/tasks` | `PROJECT_VIEW` | Bảng Kanban (sắp theo cột, rồi theo `position`) |
| POST | `/milestones/{milestoneId}/tasks` | `TASK_EDIT` | `{ title, description?, assigneeId? }` → vào cột TODO |
| PUT | `/tasks/{id}` | `TASK_EDIT` | `{ title, description?, assigneeId? }` |
| PATCH | `/tasks/{id}/status` | `TASK_EDIT` | **Kéo thả**: `{ status, position? }` (`position` tính từ 0 trong cột đích; bỏ trống = cuối cột) |
| DELETE | `/tasks/{id}` | `TASK_EDIT` | Không xoá được nếu đã có bài nộp |
| GET | `/tasks/{id}/history` | `PROJECT_VIEW` | Lịch sử đổi cột |
| GET | `/tasks/{taskId}/submissions` | `PROJECT_VIEW` | Bài nộp của task (mới nhất trước) kèm `feedbacks[]` |
| POST | `/tasks/{taskId}/submissions` | `SUBMISSION_CREATE` | `{ url, description? }` → `late` do BE tính |
| GET | `/projects/{projectId}/submissions?page=&size=` | `PROJECT_VIEW` | Toàn bộ bài nộp + feedback của nhóm (màn "Xem feedback") |
| POST | `/submissions/{submissionId}/feedbacks` | `FEEDBACK_CREATE` | `{ content, score? }` (0–10, tối đa 2 chữ số thập phân) |

`TaskResponse`: `id, milestoneId, title, description, status, position, assignee, createdBy, completedAt, submissionCount, hasLateSubmission, createdAt, updatedAt`.

### 7.7 Dashboard

| Method | Path | Quyền | Mô tả |
|---|---|---|---|
| GET | `/dashboard/summary?termId=&departmentId=` | `DASHBOARD_VIEW` | KPI của học kỳ (mặc định ACTIVE) |
| GET | `/dashboard/projects?termId=&departmentId=&advisorId=&atRisk=&sort=&page=&size=` | `DASHBOARD_VIEW` | Tiến độ từng đồ án |

`sort` nhận `completionPercent | overdueMilestones | lateSubmissions | projectCode | totalTasks` kèm `,asc` / `,desc` (mặc định `overdueMilestones,desc`). Phạm vi: giáo vụ chỉ thấy bộ môn mình, GV chỉ thấy nhóm mình, admin thấy tất cả.

```json
// GET /dashboard/summary
{ "term": { "id": "…", "code": "FA26", "name": "Fall 2026", "status": "ACTIVE" },
  "totalProjects": 4, "inProgressProjects": 4, "completedProjects": 0, "atRiskProjects": 2,
  "totalStudents": 10, "averageCompletionPercent": 53.57,
  "totalSubmissions": 34, "lateSubmissions": 6, "onTimeSubmissionPercent": 82.35,
  "bookings": { "CONFIRMED": 2, "COMPLETED": 3, "NO_SHOW": 1, "CANCELLED": 1 } }
```

Mỗi phần tử của `/dashboard/projects` gồm: `projectId, projectCode, projectTitle, projectStatus, department, advisor{id,fullName,email}, memberCount, totalTasks, doneTasks, reviewTasks, completionPercent, lateSubmissions, overdueMilestones, atRisk`.

---

## 8. Quy tắc nghiệp vụ UI phải xử lý

### Đặt lịch
1. **Đặt theo nhóm:** một slot dành cho một đồ án. Bất kỳ thành viên nào cũng đặt hoặc huỷ được, và cả nhóm cùng thấy lịch hẹn đó.
2. **Tự xác nhận ngay** (`CONFIRMED`), không có bước GV duyệt.
3. SV **chỉ đặt được slot của GVHD nhóm mình**. `GET /slots` của SV đã tự lọc sẵn, không cần truyền `advisorId`.
4. **Chống đặt trùng:** khi 2 nhóm bấm cùng lúc, chỉ một nhóm thành công; nhóm kia nhận `409 SLOT_ALREADY_BOOKED` → toast + tải lại slot.
5. SV huỷ → slot **mở lại** cho nhóm khác. GV huỷ (lịch hẹn hoặc slot) → slot **bị huỷ**. Lý do huỷ là bắt buộc. Chỉ huỷ được **trước giờ bắt đầu**.
6. GV chỉ đánh dấu *Hoàn thành* / *Vắng mặt* được **sau giờ bắt đầu**.
7. Slot của một GV không bao giờ chồng giờ nhau (`409 SLOT_OVERLAP`). Khi tạo rule, slot nào trùng sẽ bị bỏ qua và trả về trong `skippedSlots`.
8. Email và Google Calendar được xử lý **nền**, thường trễ vài giây; UI không cần chờ. Icon đồng bộ hiển thị theo `calendarSyncStatus` (`PENDING`, `SYNCED`, `FAILED`, `SKIPPED`).
9. Gặp online thì dùng `meetingUrl` (Google Meet / Zoom). Hệ thống không có video call hay chat.

### Kanban & bài nộp
10. Thành viên nhóm **và** GVHD đều tạo, sửa, kéo thả task được, nhưng chỉ khi học kỳ ACTIVE và đồ án `IN_PROGRESS`.
11. Kéo thả: gọi `PATCH /tasks/{id}/status` với cột đích và vị trí. BE tự sắp lại thứ tự cột đích, nên sau khi gọi thì FE dùng `position` trả về hoặc tải lại board.
12. **Nộp bài tự động chuyển task từ `TODO`/`IN_PROGRESS` sang `REVIEW`.**
13. **Nộp trễ vẫn được nhận**, `late = true` khi nộp sau `dueAt` của milestone → hiển thị badge **"Nộp trễ"**. Trên thẻ task có `hasLateSubmission`.
14. `url` phải bắt đầu bằng `http://` hoặc `https://`; FE nên validate ngay trên form.
15. **Bài nộp và feedback không sửa, không xoá được** (audit trail). Muốn sửa thì nộp lại hoặc viết feedback mới. UI hiển thị dạng timeline, không có nút Sửa/Xoá.
16. Điểm là thang **0–10**, không bắt buộc. Đây là điểm milestone, **không phải** điểm bảo vệ.
17. Milestone `overdue = true` nghĩa là đã quá hạn mà còn task chưa DONE → tô đỏ.

### Xếp nhóm
18. **Chỉ Admin xếp sinh viên vào nhóm** (`POST /projects/{id}/members`). GV và sinh viên không tự thêm thành viên. Màn hình admin "Xếp nhóm" lấy danh sách sinh viên còn trống bằng `GET /users?unassigned=true` (có thể kèm `q` để tìm), chọn nhóm, rồi gọi API thêm thành viên. Xếp xong, sinh viên đó tự biến mất khỏi danh sách.
19. Mỗi sinh viên chỉ thuộc **một nhóm trong một học kỳ** (`409 PROJECT_STUDENT_ALREADY_ASSIGNED`). Thành viên đầu tiên của nhóm tự thành trưởng nhóm.
20. Sinh viên chưa có nhóm: `GET /projects/mine` trả `[]` → FE hiện "Bạn chưa được xếp nhóm, vui lòng liên hệ admin" và ẩn các chức năng đặt lịch, Kanban, nộp bài (các API này trả `NOT_PROJECT_MEMBER`).

### Học kỳ
21. Học kỳ `ARCHIVED` chỉ được xem: ẩn mọi nút tạo / sửa / đặt / nộp. Nếu vẫn gọi API, BE trả `409 TERM_ARCHIVED`.

### Ngoài phạm vi MVP
Chấm điểm hội đồng bảo vệ; học phí, tín chỉ, bảng điểm; video call / chat; chấm bằng AI.

---

## 9. Quy trình phối hợp BE ↔ FE

Mục tiêu: **FE không phải sửa code mỗi khi BE cập nhật.**

1. **Swagger (`/v3/api-docs`) là nguồn sự thật** cho request/response. README này mô tả luồng và nghiệp vụ.
2. **BE chỉ thay đổi theo kiểu bổ sung** trong `/api/v1`: được thêm field, endpoint, enum value hay error code mới; **không đổi tên, không xoá, không đổi kiểu** field đang có. Thay đổi phá vỡ tương thích → `/api/v2` và báo trước.
3. FE **bỏ qua field lạ** và có fallback cho enum lạ (lấy label từ `/meta/enums`), nhờ vậy BE thêm trạng thái mới không làm FE vỡ.
4. Nhãn enum, mã lỗi, cấu hình đều lấy từ `/meta/*`. Thông điệp lỗi lấy từ `detail`. FE không hardcode.
5. Phân quyền hiển thị dựa trên `permissions`. Khi BE đổi quyền của một role, FE không cần sửa.
6. Mọi thay đổi API được ghi vào **mục 10 (Nhật ký thay đổi)** kèm ảnh hưởng tới FE.
7. Cần dữ liệu mới để test thì báo BE bổ sung vào seed (`R__dev_seed_data.sql`), rồi FE chạy `docker compose down -v` để nạp lại. Không dùng mock.

---

## 10. Nhật ký thay đổi & ảnh hưởng

### v1.3.0 (2026-11-10): Lọc sinh viên chưa có nhóm

**Ảnh hưởng tới FE**
- `GET /users` có thêm tham số `unassigned=true` (và `termId`, mặc định học kỳ ACTIVE): chỉ trả **sinh viên chưa thuộc nhóm nào** trong học kỳ đó. Dùng cho màn hình admin "Xếp nhóm" (mục 8, quy tắc 18–20).
- Chỉ bổ sung tham số: gọi `GET /users` như cũ thì kết quả không đổi. `termId` không tồn tại → `404`.

**Thay đổi trong project BE**
- `UserService.search` thêm điều kiện "không có dòng `project_members` trong học kỳ". Không đổi database.

### v1.2.1 (2026-11-10): Health check không còn báo DOWN ở máy dev

- `/actuator/health` từng trả `503 DOWN` vì Spring kiểm tra kết nối SMTP dù tính năng email đang tắt. Giờ chỉ kiểm tra SMTP khi `APP_EMAIL_ENABLED=true`, nên máy dev trả `200 UP`.
- Không đổi API, không đổi code Java.

### v1.2.0 (2026-11-10): Đăng nhập Google bằng mọi tài khoản Google admin đã thêm

**Ảnh hưởng tới FE**
- Đăng nhập Google không còn giới hạn `@fpt.edu.vn`. **Bỏ mọi kiểm tra đuôi email phía FE.**
- Lỗi mới `403 AUTH_ACCOUNT_NOT_REGISTERED` khi email chưa được admin thêm: hiện "Email này chưa được cấp quyền, liên hệ admin". `AUTH_EMAIL_DOMAIN_NOT_ALLOWED` không còn được trả về.
- Form admin "Thêm người dùng": email nhận mọi domain; ô **mật khẩu thành tuỳ chọn** (bỏ trống = tài khoản chỉ đăng nhập Google). Đây là cách admin cấp quyền đăng nhập Google cho một email.
- `UserResponse` thêm `googleLinked`; `/meta/config` thêm `autoRegisterEmailDomains` (field `allowedEmailDomains` ngừng dùng).
- Đăng nhập email + mật khẩu: giữ nguyên.

**Thay đổi trong project BE**
- Biến môi trường `APP_ALLOWED_EMAIL_DOMAINS` đổi thành **`APP_AUTO_REGISTER_EMAIL_DOMAINS`** (mặc định `fpt.edu.vn`; để trống = chỉ tài khoản admin đã thêm). Ai có `.env` cũ: đổi tên dòng này; nếu không đổi, BE dùng mặc định `fpt.edu.vn`.
- `EmailDomainPolicy`: chỉ chuẩn hoá và kiểm tra định dạng email, cộng với luật tự đăng ký; `AuthService` từ chối email lạ bằng `AUTH_ACCOUNT_NOT_REGISTERED`.
- Không đổi database.

### v1.1.1 (2026-11-10): Sửa đăng nhập Google từ FE Vite

- **Lỗi:** BE chỉ cho phép CORS từ `localhost:3000`, trong khi FE Vite chạy ở `localhost:5173`. Trình duyệt chặn `POST /auth/google` (preflight trả `403`), nên đăng nhập Google, và cả mọi API khác gọi từ FE, đều không tới được BE.
- **Sửa:** mặc định CORS và `.env.example` giờ cho phép `http://localhost:5173,http://localhost:3000`; `APP_FRONTEND_URL` mặc định là `http://localhost:5173`. **Ai đã có `.env` cũ phải sửa dòng `APP_CORS_ALLOWED_ORIGINS`** rồi khởi động lại BE.
- Không đổi API, không đổi code Java.

### v1.1.0 (2026-11-01): Đăng nhập bằng mật khẩu + đăng nhập Google thật

**Ảnh hưởng tới FE**
- **Trang đăng nhập** có thêm form **email + mật khẩu** gọi `POST /auth/login`; nút Google chỉ hiện khi `googleLoginEnabled` (mục 5.3, 5.4a, 6.4).
- Thêm màn hình **"Đổi mật khẩu"** (`POST /auth/change-password`), chỉ hiện khi `user.hasPassword`. Response là cặp token **mới**: FE lưu đè.
- Màn hình admin "Tạo người dùng": thêm ô **mật khẩu (bắt buộc)**. Thêm nút **"Cấp / reset mật khẩu"** gọi `PUT /users/{id}/password`.
- `MeResponse` và `UserResponse` có thêm field (chỉ bổ sung, không đổi field cũ): `hasPassword`, `passwordChangedAt` (chỉ trong `UserResponse`).
- `/meta/config` có thêm `passwordLoginEnabled`, `passwordMinLength`, `passwordRule`.
- Mã lỗi mới: `AUTH_INVALID_CREDENTIALS`, `PASSWORD_POLICY_VIOLATION`, `PASSWORD_INCORRECT`, `PASSWORD_SAME_AS_OLD`, `PASSWORD_NOT_SET` (mục 4).
- **Sửa `apiClient.js` (mục 6.2):** chỉ bỏ qua auto-refresh với các API auth công khai (`PUBLIC_AUTH`), để `/auth/change-password` và `/auth/me` vẫn tự refresh khi token hết hạn.
- **Breaking nhỏ:** `POST /users` giờ **bắt buộc** `password`.

**Thay đổi trong project BE**

| Hạng mục | Thay đổi |
|---|---|
| Database | `V5__user_password_login.sql`: thêm `users.password_hash` (BCrypt), `users.password_changed_at`; **mọi tài khoản đang có được gán mật khẩu `12345`** (dùng extension `pgcrypto`) |
| Dữ liệu mẫu | Tài khoản mẫu có mật khẩu `12345` |
| Code | `PasswordPolicy` (quy tắc + BCrypt), `AuthService.loginWithPassword / changePassword`, `UserService.setPassword`, bean `PasswordEncoder` |
| Dev tool | Trang test đăng nhập (mật khẩu + Google thật): `/dev/google-login.html`, **chỉ có ở profile dev** |
| Google | Code đăng nhập Google đã có từ v1.0.0; cần tạo OAuth client và điền `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` (mục 5.7) |
| Test | `PasswordPolicyTest` (13 ca); kiểm thử E2E 29 kịch bản mật khẩu/Google qua HTTP |

### v1.0.0 (2026-10-12): Backend MVP hoàn chỉnh

**Ảnh hưởng tới FE**
- Có toàn bộ API ở mục 7, nên FE **chuyển từ mock sang API thật**.
- Đăng nhập dùng **JWT + refresh token xoay vòng** (mục 5). Cần cài `axios` và (cho Google) `@react-oauth/google`.
- Field JSON là camelCase, thời gian là UTC ISO-8601 (mục 4).
- Ở môi trường dev: **email và Google Calendar đang tắt** (`APP_EMAIL_ENABLED=false`, `APP_CALENDAR_SYNC_ENABLED=false`). Booking có `calendarSyncStatus = SKIPPED`, email chỉ được ghi ra log BE. Bật lên khi đã có SMTP / Google Client.

**Thay đổi trong project BE**

| Hạng mục | Thay đổi |
|---|---|
| `pom.xml` | Thêm `spring-boot-starter-security-oauth2-resource-server` (JWT), `spring-boot-starter-mail`, `springdoc-openapi-starter-webmvc-ui 3.1.1` |
| Database | `V4__auth_tokens_and_google_credentials.sql`: bảng `refresh_tokens`, `user_google_credentials` (refresh token Google được mã hoá AES-GCM); bỏ bảng `oauth2_authorized_client`; outbox thêm trạng thái `SKIPPED` |
| Dữ liệu mẫu | `db/seed/dev/R__dev_seed_data.sql`, **chỉ nạp ở profile dev** |
| Biến môi trường mới | `APP_JWT_SECRET`, `APP_ENCRYPTION_KEY` (**bắt buộc**), `APP_JWT_ACCESS_TOKEN_TTL`, `APP_JWT_REFRESH_TOKEN_TTL`, `GOOGLE_REDIRECT_URI` → xem `.env.example`. **Ai đã có `.env` cũ phải bổ sung 2 biến bắt buộc**, nếu không app không khởi động. |
| Cấu hình | Bỏ `spring.security.oauth2.client.*`; Google cấu hình ở `app.google.*`. Profile `prod` tắt Swagger. |
| Kiến trúc | Package theo feature: `auth, user, department, term, project, availability, booking, milestone, task, submission, dashboard, notification, meta, common, config` |

### v0.1.0: Khởi tạo
Schema V1–V3, Docker PostgreSQL, cấu hình theo profile.

---

## 11. Dành cho team BE

### Cấu trúc

```
src/main/java/com/gradtrack/
├── common/        exception (ErrorCode, GlobalExceptionHandler), security (Permission, CurrentUser), web (PageResponse)
├── config/        AppProperties (app.*), SecurityConfig, JwtConfig, OpenApiConfig, WebConfig
├── auth/          Google code exchange, password login / change-password, JWT + refresh token, dev-login
├── user/ department/ term/ project/        quản trị + ProjectAccessService (quyền theo dữ liệu)
├── availability/ booking/                  lịch rảnh, slot, đặt lịch (row lock), Google Calendar handler
├── milestone/ task/ submission/            milestone, Kanban, bài nộp, feedback
├── dashboard/                              truy vấn view v_project_progress
├── notification/                           transactional outbox + worker (email / calendar, retry backoff)
└── meta/                                   enums, config, error codes cho FE
src/main/resources/db/
├── migration/     V1..V5 (schema, KHÔNG sửa file đã chạy, thêm V6, V7…)
└── seed/dev/      R__dev_seed_data.sql (chỉ profile dev, idempotent)
```

### Quy tắc
- **Đổi schema:** thêm `V<n>__mo_ta.sql`, cập nhật entity; `ddl-auto: validate` sẽ báo nếu lệch.
- **Thêm dữ liệu mẫu:** sửa `R__dev_seed_data.sql`, dùng id cố định hoặc `md5(...)::uuid` và `ON CONFLICT DO NOTHING`. Flyway tự chạy lại khi file đổi.
- **Thêm lỗi nghiệp vụ:** thêm vào `ErrorCode` (FE tự thấy qua `/meta/error-codes`), rồi `throw new BusinessException(ErrorCode.X)`.
- **Thêm quyền:** thêm vào `Permission`, gán trong `Role`, rồi dùng `@PreAuthorize("hasAuthority('X')")`.
- **Gửi thông báo:** gọi `OutboxPublisher.email(...)` / `.calendar(...)` **trong transaction nghiệp vụ**; worker sẽ gửi sau.
- **Production:** chạy với `SPRING_PROFILES_ACTIVE=prod`, cung cấp mọi biến trong `.env.example` qua biến môi trường hoặc secret manager, và tạo `APP_JWT_SECRET` / `APP_ENCRYPTION_KEY` riêng cho từng môi trường. **Không đổi `APP_ENCRYPTION_KEY` sau khi đã có dữ liệu**, nếu không sẽ không giải mã được token Google đã lưu.

---

## 12. Frontend: trạng thái tích hợp & việc cần team BE xử lý

Repo FE: React 19 + Vite 8 (JavaScript), SCSS, `react-router-dom` 6, `axios`, `@react-oauth/google`. Cập nhật lần cuối: **2026-11-10**, đồng bộ với **BE v1.3.0**.

### 12.1 Chạy FE với BE local

```bash
npm install
# .env.local (git ignore):
#   VITE_DEV_PROXY_TARGET=http://localhost:8080   ← Vite chuyển tiếp /api/* sang BE
#   VITE_API_URL=                                 ← để trống = gọi /api/v1 cùng origin (qua proxy)
npm run dev        # http://localhost:5173
npm run build
npm run lint       # oxlint
```

- **Dev:** FE gọi `/api/v1` cùng origin, Vite proxy chuyển sang BE và xoá header `Origin` (`vite.config.js`). Từ **BE v1.1.1** CORS đã cho phép `localhost:5173`, nên gọi thẳng `VITE_API_URL=http://localhost:8080/api/v1` cũng chạy (đã kiểm thử 2026-11-10).
- Khi deploy FE tách khỏi BE: đặt `VITE_API_URL=https://<be>/api/v1` và thêm origin của FE vào `APP_CORS_ALLOWED_ORIGINS`.
- `VITE_GOOGLE_CLIENT_ID` là tuỳ chọn; mặc định FE lấy `googleClientId` từ `/meta/config`.

### 12.2 Cấu trúc FE (theo FE Structure Guideline)

```
src/
├── app/
│   ├── routes/      AppRoutes (nơi DUY NHẤT ghép các feature), guards (chặn theo permission), navigation, errors/
│   └── providers/   AuthProvider (user + can()), MetaProvider (/meta/enums + /meta/config), ToastProvider
├── layouts/         AppLayout, Header, Sidebar, Footer (+ .scss cạnh component)
├── features/        mỗi feature: pages/, components/, <feature>.service.js, <feature>.constants.js, <feature>.scss
│   ├── auth/  booking/  availability/  project/  kanban/  submission/  dashboard/  admin/
├── components/ui/   Button, Card, Modal, FormField, PasswordInput, Badge (EnumBadge), States, Misc + ui.scss
├── services/        apiClient.js — axios, Bearer, refresh 1 request tại một thời điểm, PUBLIC_AUTH, chuẩn hoá lỗi RFC 7807
├── hooks/           useAuth, useMeta, useToast, useAsync, useDebounce
├── utils/           format (giờ VN), validation (định dạng email, URL, quy tắc mật khẩu)
├── constants/       enums (PERMISSIONS, màu badge), env (ENV)
└── styles/          variables.scss (biến + mixin), global.scss (reset, token, typography, layout utils)
```

Các quy tắc guideline đã kiểm tra tự động (2026-11-01): **không import chéo feature**, không gọi axios ngoài `services/`, không so sánh role trong component (chỉ `can(PERMISSION)`), không file nào > 300 dòng (lớn nhất 270), CSS của feature nằm cạnh feature.

**Không import chéo feature** được giải quyết như sau:
- Trang chi tiết đồ án `/projects/:projectId` là `ProjectLayout` (feature project). Các tab là **route con** do `app/routes` ghép: `features/kanban/pages/ProjectKanbanPage` (index), `submission/pages/ProjectSubmissionsPage` (`submissions`), `booking/pages/ProjectBookingsPage` (`bookings`), `project/pages/ProjectMembersPage` (`members`). Route con lấy dữ liệu qua `useOutletContext()` → `{ project, readOnly, setProject }`.
- Danh sách bài nộp trong modal task của Kanban được `app/routes` truyền vào qua render-prop `renderTaskSubmissions` (component `submission/components/TaskSubmissions`).
- Feature nào cần API thì tự gọi trong service của mình, ví dụ `GET /projects/mine` có trong cả `booking.service`, `dashboard.service` và `project.service`.

**Còn lệch nhẹ so với guideline:** CSS đang là SCSS thường đặt cạnh component (class có tiền tố theo feature), **chưa** chuyển sang CSS Modules (guideline ghi "nếu có thể").

### 12.3 Màn hình ↔ permission ↔ API

| Màn hình (route) | Permission | API |
|---|---|---|
| Đăng nhập (`/login`) | 🔓 | `GET /meta/config`, `GET /meta/enums`, `POST /auth/login`, `POST /auth/google`, `POST /auth/dev-login`, `POST /auth/refresh`, `GET /auth/me`, `POST /auth/logout` |
| Đổi mật khẩu (`/account/password`, menu tài khoản) | 👤, chỉ khi `user.hasPassword` | `POST /auth/change-password` (lưu đè cặp token mới) |
| Tổng quan (`/`) | 👤 (từng khối theo permission) | `GET /terms/active`, `GET /projects/mine`, `GET /bookings`, `GET /dashboard/summary` |
| Đặt lịch (`/booking`) | `BOOKING_CREATE` | `GET /projects/mine`, `GET /slots?status=OPEN`, `POST /bookings` |
| Lịch hẹn (`/bookings`, tab đồ án) | `BOOKING_VIEW` (+ `BOOKING_CANCEL`, `BOOKING_MANAGE`) | `GET /bookings`, `GET /bookings/{id}`, `POST …/cancel`, `/complete`, `/no-show`, `PUT …/notes` |
| Lịch rảnh & slot (`/availability`) | `AVAILABILITY_MANAGE` | `GET/POST /availability/rules`, `POST …/deactivate`, `GET /slots?advisorId&status=OPEN&status=BOOKED`, `POST /slots`, `POST /slots/{id}/cancel` |
| Đồ án (`/projects`, `/projects/:id/*`) | `PROJECT_VIEW` (+ `PROJECT_MANAGE`) | `GET/POST/PUT /projects`, members (ô tìm thêm thành viên chỉ hiện sinh viên chưa có nhóm: `GET /users?unassigned=true&termId=<học kỳ của đồ án>`), `GET /terms`, `GET /departments`, `GET /users?role=ADVISOR` |
| Kanban (tab đồ án) | `TASK_EDIT`, `MILESTONE_MANAGE` | milestones (+ `generate`), tasks, `PATCH /tasks/{id}/status` kèm `position`, `GET /tasks/{id}/history` |
| Bài nộp & feedback | `SUBMISSION_CREATE`, `FEEDBACK_CREATE` | `GET/POST /tasks/{id}/submissions`, `GET /projects/{id}/submissions`, `POST /submissions/{id}/feedbacks` |
| Dashboard (`/dashboard`) | `DASHBOARD_VIEW` | `GET /dashboard/summary`, `GET /dashboard/projects` |
| Người dùng (`/admin/users`) | `USER_MANAGE` | `GET/POST/PUT /users` ("Thêm người dùng": email **mọi domain**, `password` **tuỳ chọn** — bỏ trống = chỉ Google), `PUT /users/{id}/password` ("Cấp / Reset mật khẩu"), cột "Đăng nhập bằng" theo `hasPassword` + `googleLinked` |
| Xếp nhóm (`/admin/grouping`) | `PROJECT_MANAGE` (+ `USER_MANAGE`) | `GET /users?unassigned=true&termId=` (sinh viên chưa có nhóm, có `q` + phân trang), `GET /projects?termId&status=IN_PROGRESS`, `POST /projects/{id}/members`; `409 PROJECT_STUDENT_ALREADY_ASSIGNED` → toast + tải lại |
| Bộ môn, Học kỳ (`/admin/departments`, `/admin/terms`) | `DEPARTMENT_MANAGE`, `TERM_MANAGE` | `/departments`, `/terms`, `…/activate`, `…/archive` |

**Sinh viên chưa có nhóm** (`GET /projects/mine` → `[]`, quy tắc 20): Tổng quan hiện cảnh báo "Bạn chưa được xếp nhóm, vui lòng liên hệ admin" và ẩn nút "Đặt lịch hẹn"; trang Đặt lịch và Đồ án hiện cùng thông báo thay cho chức năng; FE **không gọi** `GET /slots` (BE trả `403 NOT_PROJECT_MEMBER`).

Quy tắc mật khẩu được validate trên form theo `passwordMinLength` + `passwordRule` của `/meta/config` (≥ 8 ký tự, có chữ và số, không khoảng trắng). Form **đăng nhập** không áp quy tắc này vì tài khoản cũ vẫn dùng `12345`. Lỗi `PASSWORD_INCORRECT` / `PASSWORD_SAME_AS_OLD` / `PASSWORD_POLICY_VIOLATION` được gắn vào đúng ô nhập.

### 12.4 Kiểm thử FE ↔ BE

**v1.3.0 (2026-11-10, BE local + seed dev)**

| Bộ kiểm thử | Kết quả | Nội dung |
|---|---|---|
| Gọi API qua các `*.service.js` | **12/12 PASS** | `unassigned=true&termId` chỉ trả sinh viên chưa có nhóm (SV đã có nhóm không xuất hiện); `termId` sai → `404`; xếp `tungptai170013` vào SE04 → rời danh sách; xếp tiếp vào nhóm khác → `409 PROJECT_STUDENT_ALREADY_ASSIGNED`; xoá thành viên → quay lại danh sách; SV chưa có nhóm: `/projects/mine` = `[]`, `/slots` → `403 NOT_PROJECT_MEMBER` |
| Render giao diện (jsdom) | **18/18 PASS** | SV chưa có nhóm: cảnh báo ở Tổng quan, ẩn nút đặt lịch, trang Đặt lịch / Đồ án hiện thông báo, không phát sinh lỗi 403; admin: menu + trang "Xếp nhóm", xếp nhóm qua UI; ô tìm thành viên chỉ sinh viên chưa có nhóm; giáo vụ vào `/admin/grouping` → 403; chạy lại các trang chính |

Dữ liệu test v1.3.0: phép xếp nhóm thử (`tungptai170013` → SE04) **đã được hoàn tác**, không để lại dữ liệu.

**v1.2.0 (2026-11-10, BE local + seed dev)**

| Bộ kiểm thử | Kết quả | Nội dung |
|---|---|---|
| Gọi API qua các `*.service.js` | **11/11 PASS** | `/meta/config` có `autoRegisterEmailDomains`; FE chỉ kiểm tra định dạng email; Gmail lạ đăng nhập mật khẩu → `AUTH_INVALID_CREDENTIALS`, dev-login → `AUTH_ACCOUNT_NOT_REGISTERED`; `UserResponse.googleLinked`; admin thêm Gmail **không mật khẩu** → `hasPassword=false`; mật khẩu yếu → `PASSWORD_POLICY_VIOLATION`; Gmail admin đã thêm đăng nhập được với đúng role |
| Render giao diện (jsdom, gọi thẳng BE từ origin `:5173`) | **21/21 PASS** | Trang đăng nhập không còn chặn đuôi email, nút Google không có `hosted_domain`; gợi ý tự đăng ký từ `autoRegisterEmailDomains`; admin: cột "Đăng nhập bằng", modal "Thêm người dùng" mật khẩu tuỳ chọn; chạy lại các trang của 4 role |

Dữ liệu test v1.2.0 để lại: **`fe.v120.test@gmail.com`** (ADVISOR, Google-only, **đã vô hiệu hoá**).

**v1.1.0 (2026-11-01, BE local + seed dev)**

| Bộ kiểm thử | Kết quả | Nội dung |
|---|---|---|
| Gọi API qua các `*.service.js` | **28/28 PASS** | Đăng nhập mật khẩu (`12345`); sai mật khẩu / email lạ → `AUTH_INVALID_CREDENTIALS` và **không** gọi refresh; email ngoài trường → `AUTH_EMAIL_DOMAIN_NOT_ALLOWED`; `PASSWORD_INCORRECT`, `PASSWORD_POLICY_VIOLATION`; `/auth/change-password` khi access token hết hạn → tự refresh rồi gọi lại (đúng `PUBLIC_AUTH`); `POST /users` thiếu / yếu mật khẩu bị từ chối; cấp mật khẩu → đăng nhập → đổi mật khẩu → token mới, mật khẩu cũ hết hiệu lực |
| Render giao diện (jsdom) | **31/31 PASS** | Form mật khẩu + nút Google + dev-login; sai mật khẩu hiện `detail`; 4 role đăng nhập bằng mật khẩu; trang đổi mật khẩu; các tab route con của đồ án (Kanban / bài nộp / lịch hẹn / thành viên); modal task có phần bài nộp; lịch rảnh; dashboard; trang admin có cột mật khẩu, modal tạo user có ô mật khẩu, modal reset mật khẩu; token hỏng → `/login` |
| Proxy Vite | OK | `POST /auth/login` qua `:5173` kèm header `Origin` → 200 |

Dữ liệu test để lại: tài khoản **`fe.pwtest@fpt.edu.vn`** (STUDENT, **đã vô hiệu hoá**) dùng để test luồng cấp/đổi mật khẩu mà không đụng tài khoản mẫu. Muốn sạch hẳn: `docker compose down -v`.

**Chưa kiểm thử được:** đăng nhập Google thật (nút đã hiện vì BE bật `googleLoginEnabled`, nhưng cần đăng nhập bằng tay trên trình duyệt), email và đồng bộ Google Calendar thật, giao diện trên trình duyệt thật / điện thoại.

### 12.5 Việc cần team BE xử lý / xác nhận

Đã xử lý: health check báo `DOWN` vì mail (BE v1.2.1, FE kiểm tra `/actuator/health` → `200`).

| # | Mức độ | Vấn đề | Cách tái hiện / đề xuất |
|---|---|---|---|
| 1 | **Cao** | **Giờ trong lịch rảnh của seed data lệch +8 giờ** (vẫn còn ở v1.3.0, kiểm tra 2026-11-10). Rule seed của `hoangnm` trả `dayOfWeek 2, "17:00"–"19:00"` và `dayOfWeek 4, "22:00"–"00:00"`, nhưng slot sinh ra bắt đầu 09:00 thứ 3 giờ VN (đúng mục 3: 9–11h, 14–16h). Rule tạo qua API thì đúng giờ. | `GET /availability/rules` với `hoangnm@fpt.edu.vn`. Sửa giờ rule trong `R__dev_seed_data.sql`. Màn "Lịch rảnh hằng tuần" hiển thị đúng giá trị BE trả về nên GV sẽ thấy giờ sai. |
| 2 | Trung bình | `POST /availability/rules` từng trả `409 CONFLICT` chung chung (không có mã nghiệp vụ) với khung `07:00–08:00` (tài khoản `quanlv`, CN 13–20/12), trong khi `06:30–07:30` và `08:00–09:00` tạo được. | Body: `{"dayOfWeek":7,"startTime":"07:00","endTime":"08:00","effectiveFrom":"2026-12-13","effectiveTo":"2026-12-20"}`. Nên map sang mã cụ thể (vd. `SLOT_OVERLAP`) hoặc sửa nguyên nhân. (Chưa test lại ở v1.1.0 để tránh tạo thêm dữ liệu.) |
| 3 | Thấp | `errors[].message` của Bean Validation còn tiếng Anh. FE đang tự dịch các câu phổ biến (`must not be blank` → "Không được để trống"…). | Cấu hình `ValidationMessages_vi`. |
| 4 | Thấp | Chưa có API thông báo trong ứng dụng nên FE không có chuông thông báo. PDF chỉ yêu cầu email nên không phải lỗi. | Nếu cần: `GET /notifications`, `PATCH /notifications/{id}/read`, `POST /notifications/read-all`. |

### 12.6 Nhật ký thay đổi FE

**FE v1.3.0 (2026-11-10): đồng bộ BE v1.2.1 + v1.3.0**
- Trang admin mới **"Xếp nhóm"** (`/admin/grouping`, menu Quản trị, quyền `PROJECT_MANAGE`): chọn học kỳ, danh sách sinh viên chưa có nhóm (`GET /users?unassigned=true&termId=`, tìm kiếm + phân trang), chọn nhóm và xếp (`POST /projects/{id}/members`), bên phải là các nhóm của học kỳ kèm số thành viên / trưởng nhóm.
- Ô tìm thành viên trong tab "Thành viên" của đồ án chỉ hiện sinh viên chưa có nhóm trong học kỳ của đồ án (tránh `PROJECT_STUDENT_ALREADY_ASSIGNED`).
- Quy tắc 20, sinh viên chưa có nhóm: cảnh báo ở Tổng quan và ẩn nút đặt lịch; trang Đặt lịch và Đồ án hiện "Bạn chưa được xếp nhóm, vui lòng liên hệ admin"; không gọi `/slots` khi chưa có nhóm.
- `project.service`: `getUnassignedStudents`; `project.constants.js`, `booking.constants`, `dashboard.constants`: `NO_GROUP_MESSAGE`.

**FE v1.2.0 (2026-11-10): đồng bộ BE v1.1.1 + v1.2.0**
- **Bỏ mọi kiểm tra đuôi email phía FE** (form mật khẩu, dev-login, thêm người dùng): chỉ kiểm tra định dạng; BE quyết định (`AUTH_ACCOUNT_NOT_REGISTERED`, `AUTH_INVALID_CREDENTIALS`). `validation.isAllowedEmail` → `isValidEmail`.
- Nút Google bỏ tham số `hosted_domain` (trước đây giới hạn chọn tài khoản `@fpt.edu.vn`), nên Gmail đã được admin thêm đăng nhập được.
- Trang đăng nhập: đổi lời giới thiệu; gợi ý "email @… tự tạo tài khoản sinh viên" lấy từ `autoRegisterEmailDomains` (không dùng `allowedEmailDomains` nữa). Lỗi Google `AUTH_ACCOUNT_NOT_REGISTERED` hiển thị `detail` của BE.
- Admin "Thêm người dùng": email mọi domain, **mật khẩu tuỳ chọn** (bỏ trống = chỉ Google; nếu nhập thì validate theo `passwordRule`). Cột "Đăng nhập bằng": Mật khẩu / Google (đã liên kết | chưa liên kết) theo `hasPassword` + `googleLinked`.
- `.env.example`: ghi chú CORS `:5173` đã được BE cho phép (v1.1.1).

**FE v1.1.0 (2026-11-01): đồng bộ BE v1.1.0 + cấu trúc theo FE Guideline**
- Trang đăng nhập: form **email + mật khẩu** (`POST /auth/login`), nút Google khi `googleLoginEnabled`, ô dev-login thu gọn khi `devLoginEnabled`.
- Thêm trang **Đổi mật khẩu** (`/account/password`) trong menu tài khoản, chỉ hiện khi `hasPassword`; response là cặp token mới nên FE lưu đè.
- Admin: tạo user **bắt buộc mật khẩu**; nút **Cấp / Reset mật khẩu** (`PUT /users/{id}/password`); cột "Mật khẩu" (Có / Chỉ Google).
- `apiClient`: chuyển sang danh sách `PUBLIC_AUTH` như mục 6.2 nên `/auth/change-password` cũng được tự refresh.
- Tái cấu trúc theo guideline: `app/routes`, `app/providers`, `layouts/`, `features/*/{pages,components,*.service.js,*.constants.js,*.scss}`, `styles/{global,variables}.scss`; bỏ toàn bộ import chéo feature (route con + outlet context + render-prop); tách `AvailabilityPage` (446 dòng) và `UsersPage` thành component nhỏ.

**FE v1.0.0 (2026-10-12):** bỏ mock, gọi API thật (BE v1.0.0), JWT + refresh token xoay vòng, hiển thị theo `permissions`, nhãn enum từ `/meta/enums`.
