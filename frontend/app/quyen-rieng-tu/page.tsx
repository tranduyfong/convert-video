import { brand } from "../site";
export const metadata = {
  title: "Quyền riêng tư | " + brand,
  robots: { index: false },
};
export default function Privacy() {
  return (
    <main className="legal">
      <a href="/">← Trang chủ</a>
      <h1>Quyền riêng tư</h1>
      <p>
        Khi bạn phân tích liên kết, máy chủ gửi mã video đến YouTube. Trình
        duyệt tải ảnh thu nhỏ từ máy chủ hình ảnh của YouTube sau khi phân tích
        thành công.
      </p>
      <p>
        Thông tin phân tích và trạng thái tác vụ được lưu tạm trong bộ nhớ. File
        được lưu trong thư mục riêng của tác vụ và được dọn sau khi hết hạn.
        Cookie phiên chỉ dùng để cấp quyền xem và tải file của bạn.
      </p>
      <p>
        Ứng dụng dùng địa chỉ IP trong bộ nhớ để giới hạn tần suất yêu cầu.
        Không có tài khoản, lịch sử tải hay công cụ theo dõi quảng cáo.
      </p>
    </main>
  );
}
