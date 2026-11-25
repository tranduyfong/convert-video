# TubeGo

Công cụ tiếng Việt để phân tích một video YouTube và tải MP4 hoặc MP3. Next.js xuất HTML tĩnh cho trang chủ. Express phục vụ cả giao diện, API và file trên cùng tên miền. yt-dlp đọc nguồn, FFmpeg tạo file, ffprobe xác minh luồng media trước khi mở nút tải.

## Chạy trên máy cá nhân

Dùng Node.js 22.22 trở lên thuộc dòng 22 hoặc Node 24, npm, yt-dlp có thành phần EJS, FFmpeg có libx264, AAC và libmp3lame, cùng ffprobe. Đặt ba chương trình media trong PATH hoặc khai báo đường dẫn trong `.env`. Bản Windows chính thức của yt-dlp có sẵn EJS. Trên Linux có thể cài gói Python `yt-dlp[default]` trong môi trường ảo. Ứng dụng truyền `--js-runtimes node` để dùng Node đã cài. [Hướng dẫn EJS của yt-dlp](https://github.com/yt-dlp/yt-dlp/wiki/EJS)

Từ thư mục gốc, sao chép `.env.example` thành `.env` nếu chưa có. Trên PowerShell dùng `Copy-Item .env.example .env`. Trên Linux dùng `cp .env.example .env`. Bản bàn giao trong workspace Windows đã có cấu hình local và các chương trình media trong `.tools/`.

```sh
npm ci
npm run build
npm start
```

Mở [TubeGo trên máy cá nhân](http://localhost:3000). Máy chủ cần kết nối ra YouTube khi phân tích và xử lý. Để sửa giao diện, chạy lại `npm run build:web` rồi tải lại trang. Khi sửa backend, chạy `npm run build:api` và khởi động lại tiến trình Node.

## Triển khai VPS

1. Cài Docker Engine và Compose plugin, đưa mã nguồn và lockfile lên VPS. Tạo `.env` từ file mẫu. Đặt `SITE_URL` thành URL HTTPS chính thức, ví dụ `https://video.example.org`, và đổi `BRAND_NAME` nếu cần. Tên miền ví dụ phải được thay bằng tên miền của bạn.
2. Trong DNS, trỏ bản ghi A đến IPv4 của VPS. Chỉ thêm AAAA khi IPv6 hoạt động. Cho phép kết nối đến cổng 80 và 443.
3. Chạy `docker compose up -d --build`. Compose xuất cổng ứng dụng trên loopback. Dùng `docker compose logs --tail=100 tubego` để kiểm tra khởi động.
4. Đặt reverse proxy trên host. Ví dụ Caddyfile bên dưới dùng Caddy tự cấp chứng chỉ khi DNS và cổng đã sẵn sàng. Thay tên miền rồi tải lại cấu hình Caddy.

```caddy
video.example.org {
    reverse_proxy 127.0.0.1:3000
}
```

Để giới hạn tần suất theo người dùng sau proxy, đặt `TRUST_PROXY` bằng IP hoặc CIDR tin cậy của proxy mà Express trực tiếp nhìn thấy. Với Docker bridge, đó có thể là IP gateway của bridge. Chỉ cấp quyền cho proxy thực sự kiểm soát các header chuyển tiếp. Khi biến trống, Express đếm theo IP kết nối trực tiếp. Giữ cổng ứng dụng chỉ cho reverse proxy truy cập. Kiểm tra trang chủ, một lượt phân tích, tải file qua HTTPS, `/robots.txt` và `/sitemap.xml`.

## Cấu hình

| Biến | Mặc định | Tác dụng |
| --- | --- | --- |
| BRAND_NAME, SITE_URL | TubeGo, http://localhost:3000 | Thương hiệu và URL gốc của HTML, canonical, metadata, sitemap. Build lại frontend khi đổi. SITE_URL HTTPS bật cookie Secure. |
| PORT | 3000 | Cổng local hoặc cổng host của Compose. |
| MAX_CONCURRENT, MAX_WAITING | 2, 8 | Số tác vụ chạy và số tác vụ chờ tối đa. |
| MAX_ANALYSES | 3 | Giới hạn số lượt phân tích đồng thời. |
| MAX_DURATION_SECONDS | 1800 | Thời lượng nguồn tối đa. |
| MAX_FILE_MB | 256 | Số MiB tối đa cho mỗi luồng tải và cho file kết quả. Thư mục đang xử lý có thể cần tới ba lần mức này. |
| JOB_TIMEOUT_SECONDS | 600 | Thời gian chạy tối đa của tác vụ kể từ lúc bắt đầu xử lý. Phân tích tối đa 60 giây. |
| FILE_TTL_SECONDS | 900 | Thời gian cấp quyền tải sau khi file sẵn sàng. Dọn thư mục định kỳ, chờ lượt tải đang mở kết thúc. |
| TEMP_ROOT | .tmp | Thư mục tạm riêng của tiến trình. Compose dùng volume tại /app/tmp. |
| YT_DLP_PATH, FFMPEG_PATH, FFPROBE_PATH | Tên lệnh trong PATH | Đường dẫn chương trình khi chạy local. Image cài sẵn cả ba. |
| YT_DLP_VERSION | Giá trị trong compose.yaml | Phiên bản Python package cài khi build image. |

Giảm concurrency và thời lượng nguồn nếu VPS có ít CPU. Dành dung lượng cho cả nguồn tạm lẫn các file đã hoàn tất đang chờ hết hạn. Các giới hạn theo IP là 12 lượt/phút cho từng API POST và 150 yêu cầu/phút cho toàn bộ API. Danh sách phân tích lưu tối đa 300 bản ghi và mỗi lượt có hiệu lực 10 phút.

## Luồng API

| Yêu cầu | Dữ liệu và kết quả |
| --- | --- |
| POST /api/analyze | Gửi JSON `{"url":"https://youtu.be/YE7VzlLtp-4"}`. Nhận analysisId, tiêu đề, kênh, ảnh, thời lượng và các mức MP4 có nguồn phù hợp. |
| POST /api/jobs | Gửi analysisId, format (`mp4` hoặc `mp3`) và quality dạng số. Nhận HTTP 202, id và cookie ngẫu nhiên HttpOnly riêng cho đường dẫn tác vụ. |
| GET /api/jobs/:id | Gửi cookie tương ứng để xem stage, percent nếu có, hoặc thông tin file và thời điểm hết hạn tính bằng mili giây Unix. |
| GET /api/jobs/:id/download | Gửi cùng cookie để tải file đã sẵn sàng. Phản hồi dùng tên file đính kèm hỗ trợ Unicode. |

Chỉ một số hostname, kiểu đường dẫn và mã video hợp lệ được chuẩn hóa thành URL watch. Danh sách phát và tham số chia sẻ bị loại khi chuẩn hóa. Máy chủ chọn format ID từ metadata thật, lấy luồng HTTP(S) trực tiếp có thể xử lý, ghép hình và tiếng nếu cần. Mức hình được xác định theo cạnh ngắn, phù hợp với cả video dọc. Mỗi MP4 hoàn tất phải có H.264 đúng mức đã chọn và âm thanh AAC. Ba tùy chọn MP3 là bitrate xuất. Khi tải một luồng có dung lượng xác định, phần trăm dựa trên số byte đã nhận. Khi chuyển đổi, phần trăm dựa trên thời lượng FFmpeg đã xuất so với thời lượng video. Thanh đạt 100% sau khi file đã được kiểm tra và sẵn sàng tải.

## Kiểm tra

```sh
npm run build
npm run typecheck
npm test
node tests/browser.mjs
```

Bài thử trình duyệt dùng Chrome đã cài trên máy, hoặc đặt `BROWSER_PATH` tới Chromium/Edge. Nó kiểm tra ở chiều rộng 375 và 1280 px với nguồn mô phỏng. Bộ test Node kiểm tra parser URL, mức nguồn, giới hạn hàng đợi, lỗi, quyền đọc trạng thái và file, dọn hết hạn cùng HTML SEO đã build. Các bài tự động này không phụ thuộc vào YouTube.

Để kiểm tra nguồn thật, mở một video bạn có quyền tải, chọn mức khả dụng, tải file rồi dùng lệnh sau. Kiểm tra codec hình/tiếng và kích thước MP4, hoặc codec và bitrate MP3. Đối chiếu kích thước file trên đĩa với thông tin tải.

```sh
ffprobe -v error -show_streams -show_format -of json "video.mp4"
```

### Kết quả kiểm thử trong workspace

Đã chạy cả bốn endpoint với video công khai *Big Buck Bunny* của Blender Foundation (mã YE7VzlLtp-4), dùng yt-dlp 2026.11.23, FFmpeg và ffprobe 9.1. File được tải lại từ endpoint download và kiểm tra độc lập.

| Tùy chọn qua API | Kết quả ffprobe | Dung lượng | Từ lúc phân tích đến sẵn sàng |
| --- | --- | ---: | ---: |
| MP4 360p | H.264 640×360, tiếng AAC, 596,544 giây | 53.770.654 byte | 116 giây |
| MP3 192 kbps | Stereo 192.000 bit/s, 596,544 giây | 14.318.253 byte | 33 giây |

Yêu cầu có cookie hợp lệ tải được file; thiếu cookie trả HTTP 404. Thời gian trên là kết quả của hai lượt thử trên máy phát triển. Video thử BaW_jenozKc được YouTube thông báo không khả dụng. Compose đã qua kiểm tra cấu hình; Docker daemon trên máy chưa chạy nên chưa xác minh quá trình build/chạy image.

## Cập nhật yt-dlp

Với binary chính thức, dùng `yt-dlp -U` hoặc gọi binary bằng đường dẫn đã cấu hình. Với venv, kích hoạt venv rồi chạy `python -m pip install -U "yt-dlp[default]"`. Trong Docker, đặt `YT_DLP_VERSION` thành bản phát hành mục tiêu trong `.env`, chạy `docker compose build --pull tubego` rồi `docker compose up -d`. Kiểm tra lại bằng video được phép tải sau mỗi lần nâng cấp. [Các bản phát hành yt-dlp](https://github.com/yt-dlp/yt-dlp/releases)

## Google Search Console

Sau khi HTTPS hoạt động, thêm thuộc tính **Miền** cho tên miền thật trong Search Console. Sao chép bản ghi TXT Google cấp vào DNS, chờ cập nhật rồi chọn **Xác minh**. Giữ bản ghi TXT sau khi xác minh. Trong mục **Sơ đồ trang web**, gửi URL tuyệt đối của `/sitemap.xml`. Dùng công cụ kiểm tra URL cho trang chủ để kiểm tra canonical và khả năng truy cập. Sitemap chỉ chứa trang chủ. API và file dùng header noindex. [Xác minh quyền sở hữu](https://support.google.com/webmasters/answer/9008080) · [Gửi sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)

## Giới hạn vận hành

Một tiến trình sở hữu một hàng đợi và một thư mục tạm. Khởi động lại sẽ mất các tác vụ và quyền tải cũ. Khi khởi động, máy chủ dọn thư mục mang tiền tố và mẫu UUID của ứng dụng. Không dùng chung TEMP_ROOT giữa nhiều instance. Trang đã tải lại không khôi phục phiên thao tác. File hết hạn được dọn trong lần quét kế tiếp, thường trong 30 giây.

YouTube có thể thay đổi format hoặc từ chối yêu cầu theo IP, khu vực hay tình trạng video. Nguồn chỉ có manifest, DRM, yêu cầu đăng nhập hoặc không xác định được thời lượng có thể không xử lý được. Nếu nguồn biến mất giữa hai bước, tác vụ báo lỗi. Khả năng tải từ máy cá nhân không bảo đảm IP của VPS được YouTube chấp nhận. Chuyển đổi H.264 có thể tốn CPU dù chỉ ghép một video ngắn.
