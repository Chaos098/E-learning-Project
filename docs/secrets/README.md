# Khoá bí mật của dự án (chỉ lưu trên máy)

Thư mục này chứa khoá bí mật dùng khi làm việc với dự án. **Mọi file ở đây đều bị git bỏ qua** (xem `.gitignore`), trừ file `README.md` này. Không chép nội dung các file bí mật vào tài liệu khác, commit, issue hay tin nhắn nhóm.

| File | Nội dung | Dùng để |
|---|---|---|
| `github-token.txt` | Token GitHub classic (bắt đầu bằng `ghp_`) của PO, chỉ một dòng | Push lên GitHub, kể cả commit có sửa `.github/workflows/` (TD-01). Token chỉ cần 2 quyền: `repo` và `workflow` |

## Push bằng token này

Không lưu token vào `git config` hay vào URL của `origin`. Thông tin đăng nhập cũ trong Keychain đã hết hiệu lực, nên mọi lần push đều chạy lệnh sau từ thư mục gốc của project:

```bash
git -c credential.helper= -c credential.helper='!f() { echo username=x-access-token; echo "password=$(cat docs/secrets/github-token.txt)"; }; f' push origin main
```

Lệnh trên chỉ dùng token cho đúng một lần push, không ghi đè thông tin đăng nhập đang lưu trong Keychain.

## Lưu ý

- CI trên GitHub Actions **không cần** token này: workflow tự có `GITHUB_TOKEN`. Token chỉ cần để *push* file workflow.
- Token hiện tại hết hạn ngày 23/12/2026. Hết hạn hoặc lộ ra ngoài thì thu hồi trên GitHub (Settings → Developer settings → Personal access tokens) và tạo token mới, rồi ghi đè `github-token.txt`.
- Nếu dùng token fine-grained (`github_pat_`): phần *Repository access* phải là **Only select repositories** và chọn repo này. Để *Public repositories* thì token chỉ đọc được, push bị lỗi 403.
- Máy mới clone project sẽ không có file token; PO tự tạo lại file.
