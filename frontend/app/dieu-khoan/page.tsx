import { brand } from "../site";
export const metadata = {
  title: "Điều khoản sử dụng | " + brand,
  robots: { index: false },
};
export default function Terms() {
  return (
    <main className="legal">
      <a href="/">← Trang chủ</a>
      <h1>Điều khoản sử dụng</h1>
      <p>
        Chỉ tải nội dung bạn sở hữu hoặc được phép tải. Bạn chịu trách nhiệm
        kiểm tra quyền sử dụng nội dung và tuân thủ điều khoản của nền tảng
        nguồn.
      </p>
      <p>
        Công cụ xử lý từng video có thể truy cập công khai. Chất lượng phụ thuộc
        vào nguồn mà YouTube cung cấp. Các giới hạn thời lượng, dung lượng và số
        tác vụ giúp chia sẻ tài nguyên máy chủ.
      </p>
      <p>
        Hãy lưu file về thiết bị trước thời điểm hết hạn. Sau khi file bị xóa,
        bạn cần tạo tác vụ mới.
      </p>
    </main>
  );
}
