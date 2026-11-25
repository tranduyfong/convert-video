import "./guide.css";

const steps = [
  {
    title: "Sao chép liên kết",
    text: "Mở video trên YouTube, chọn Chia sẻ rồi sao chép đường liên kết.",
  },
  {
    title: "Chọn định dạng",
    text: "Dán link, nhấn Phân tích rồi chọn MP4 hoặc MP3 và mức chất lượng phù hợp.",
  },
  {
    title: "Tải file về máy",
    text: "Bắt đầu xử lý. Khi file đã sẵn sàng, nhấn Tải file để lưu vào thiết bị.",
  },
];

const questions = [
  [
    "Vì sao video của tôi không có lựa chọn 1080p?",
    "Các mức khả dụng phụ thuộc vào nguồn YouTube cung cấp cho video đó. Nếu thiếu luồng hình đúng độ phân giải hoặc thiếu âm thanh, mức tương ứng sẽ bị khóa.",
  ],
  [
    "Vì sao đôi khi tôi không tải được video?",
    "Video có thể đã bị gỡ, đặt ở chế độ riêng tư, đang phát trực tiếp hoặc vượt giới hạn xử lý. YouTube đôi khi từ chối truy cập hoặc yêu cầu xác minh. Nếu máy chủ đang bận, bạn có thể thử lại sau.",
  ],
  [
    "Tôi có thể dùng đường dẫn Shorts hoặc playlist không?",
    "Bạn có thể dán liên kết Shorts hoặc liên kết chia sẻ dạng youtu.be. Với đường dẫn video có kèm playlist, công cụ chỉ xử lý video đang được chọn. Hãy mở một video cụ thể trước khi sao chép liên kết.",
  ],
  [
    "File đã xử lý được lưu trong bao lâu?",
    "Sau khi xử lý xong, thời gian còn lại xuất hiện cạnh nút tải. Hãy lưu file về thiết bị trước khi hết hạn. Bạn có thể tạo lại file từ đường liên kết ban đầu.",
  ],
];

function Spark({ x, y }: { x: number; y: number }) {
  return (
    <path
      transform={`translate(${x} ${y})`}
      d="M0 -6 Q0 0 6 0 Q0 0 0 6 Q0 0 -6 0 Q0 0 0 -6Z"
      fill="currentColor"
    />
  );
}

function StepArt({ step }: { step: number }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 280 112" className="tg-step-art">
      {step === 0 && (
        <g>
          <g transform="rotate(-6 140 56)" strokeLinejoin="round">
            <rect
              x="68"
              y="23"
              width="124"
              height="68"
              rx="8"
              fill="#ffd7d8"
              stroke="#a94350"
              strokeWidth="1.8"
            />
            <rect
              x="65"
              y="18"
              width="124"
              height="68"
              rx="8"
              fill="#fff8f6"
              stroke="#a94350"
              strokeWidth="1.8"
            />
            <path d="M65 32H189" stroke="#a94350" strokeWidth="1.6" />
            <g fill="#d67981">
              <circle cx="75" cy="25" r="1.8" />
              <circle cx="82" cy="25" r="1.8" />
              <circle cx="89" cy="25" r="1.8" />
            </g>
            <rect x="86" y="42" width="49" height="32" rx="6" fill="#ed6370" />
            <path d="M106 50l13 8-13 8z" fill="#fff" />
            <path
              d="M145 48h28m-28 7h21"
              stroke="#edb2b7"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <rect
              x="153"
              y="64"
              width="53"
              height="26"
              rx="13"
              fill="#fff"
              stroke="#a94350"
              strokeWidth="1.8"
            />
            <g
              fill="none"
              stroke="#c34856"
              strokeWidth="2.4"
              strokeLinecap="round"
            >
              <path
                d="m175 77-3 3a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0m7 8 3-3a4 4 0 0 1 6 6l-5 5a4 4 0 0 1-6 0"
                transform="translate(-1 0)"
              />
              <path d="m175 80 9-7" />
            </g>
          </g>
          <Spark x={208} y={33} />
          <Spark x={60} y={74} />
        </g>
      )}
      {step === 1 && (
        <g>
          <g transform="rotate(5 134 57)" strokeLinejoin="round">
            <rect
              x="83"
              y="23"
              width="108"
              height="69"
              rx="8"
              fill="#d6d8fd"
              stroke="#6465a8"
              strokeWidth="1.8"
            />
            <rect
              x="80"
              y="18"
              width="108"
              height="69"
              rx="8"
              fill="#fafaff"
              stroke="#6465a8"
              strokeWidth="1.8"
            />
            <path d="M80 34H188" stroke="#6465a8" strokeWidth="1.5" />
            <g fill="#999adb">
              <circle cx="89" cy="26" r="1.7" />
              <circle cx="96" cy="26" r="1.7" />
              <circle cx="103" cy="26" r="1.7" />
            </g>
            <rect x="90" y="46" width="41" height="27" rx="4" fill="#7374bc" />
            <rect
              x="138"
              y="46"
              width="40"
              height="27"
              rx="4"
              fill="#f0effd"
              stroke="#b5b6dc"
            />
            <g
              textAnchor="middle"
              fontFamily="Arial,sans-serif"
              fontSize="11"
              fontWeight="bold"
            >
              <text x="110" y="63" fill="#fff">
                MP4
              </text>
              <text x="158" y="63" fill="#6666a3">
                MP3
              </text>
            </g>
            <path
              d="m125 64 5 25 6-8 8 7 4-5-8-7 9-4z"
              fill="white"
              stroke="#51518d"
              strokeWidth="2"
            />
          </g>
          <Spark x={67} y={51} />
          <Spark x={203} y={67} />
        </g>
      )}
      {step === 2 && (
        <g>
          <g transform="rotate(-5 140 61)" strokeLinejoin="round">
            <path
              d="M76 47a6 6 0 0 1 6-6h23l7 8h60a6 6 0 0 1 6 6v33H83a7 7 0 0 1-7-7z"
              fill="#99d2c5"
              stroke="#36786e"
              strokeWidth="1.8"
            />
            <path
              d="M113 28h35l13 13v32h-48z"
              fill="#f6fff9"
              stroke="#468577"
              strokeWidth="1.8"
            />
            <path
              d="M148 28v13h13m-39 9h19m-19 7h25"
              fill="none"
              stroke="#72ab9c"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <path
              d="M86 59h92a4 4 0 0 1 4 5l-5 19a8 8 0 0 1-8 6H85a5 5 0 0 1-5-6l3-20a5 5 0 0 1 3-4z"
              fill="#cceddf"
              stroke="#36786e"
              strokeWidth="1.8"
            />
            <circle
              cx="179"
              cy="53"
              r="16"
              fill="#4c9586"
              stroke="#36786e"
              strokeWidth="1.8"
            />
            <path
              d="M179 44v15m-6-6 6 6 6-6"
              stroke="white"
              fill="none"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
          <Spark x={69} y={35} />
          <Spark x={205} y={76} />
        </g>
      )}
    </svg>
  );
}

export default function Guide() {
  return (
    <div className="tg-guide">
      <section id="cach-su-dung" aria-labelledby="tg-steps-title">
        <h2 id="tg-steps-title">Cách tải video YouTube trong 3 bước</h2>
        <div className="tg-step-grid">
          {steps.map((step, index) => (
            <article
              className={`tg-step tg-step-${index + 1}`}
              key={step.title}
            >
              <div className="tg-art-panel">
                <StepArt step={index} />
              </div>
              <div className="tg-step-copy">
                <h3>
                  <span
                    className="tg-step-number"
                    aria-label={`Bước ${index + 1}`}
                  >
                    {index + 1}
                  </span>
                  {step.title}
                </h3>
                <p>{step.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section id="chat-luong" aria-labelledby="tg-quality-title">
        <h2 id="tg-quality-title">Chọn chất lượng tải phù hợp</h2>
        <div className="tg-format-grid">
          <article>
            <h3>Video MP4</h3>
            <p>
              Chọn MP4 khi bạn cần cả hình và tiếng. Mức 360p tiết kiệm dung
              lượng, 720p HD cân bằng độ nét và kích thước file, còn 1080p Full
              HD phù hợp để xem trên màn hình lớn.
            </p>
          </article>
          <article>
            <h3>Âm thanh MP3</h3>
            <p>
              Chọn MP3 khi chỉ cần nghe. Mức 128 kbps cho file nhỏ, 192 kbps cân
              bằng dung lượng và bitrate, còn 320 kbps dùng nhiều bộ nhớ hơn.
              Bitrate xuất cao hơn không khôi phục được chất lượng đã mất của
              nguồn.
            </p>
          </article>
        </div>
      </section>
      <section id="cau-hoi" aria-labelledby="tg-faq-title">
        <h2 id="tg-faq-title">Câu hỏi thường gặp</h2>
        <div className="tg-faq-list">
          {questions.map(([title, answer]) => (
            <details key={title}>
              <summary>
                {title}
                <span className="tg-disclosure-mark" aria-hidden="true" />
              </summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
