# Khoá bí mật của dự án (chỉ lưu trên máy)

Thư mục này chứa khoá bí mật dùng khi làm việc với dự án. **Mọi file ở đây đều bị git bỏ qua** (xem `.gitignore`), trừ file `README.md` này. Không chép nội dung các file bí mật vào tài liệu khác, commit, issue hay tin nhắn nhóm.

| File | Nội dung | Dùng để |
|---|---|---|
| `github-token.txt` | Token GitHub (fine-grained, bắt đầu bằng `github_pat_`) của PO, chỉ một dòng | Push commit có sửa `.github/workflows/` (TD-01). Token cần quyền **Contents** và **Workflows** ở mức *Read and write* |

## Push bằng token này

Không lưu token vào `git config` hay vào URL của `origin`. Khi cần push thay đổi trong `.github/workflows/`, chạy từ thư mục gốc của project:

```bash
git -c credential.helper= -c credential.helper='!f() { echo username=x-access-token; echo "password=$(cat docs/secrets/github-token.txt)"; }; f' push origin main
```

Lệnh trên chỉ dùng token cho đúng một lần push, không ghi đè thông tin đăng nhập đang lưu trong Keychain.

## Lưu ý

- CI trên GitHub Actions **không cần** token này: workflow tự có `GITHUB_TOKEN`. Token chỉ cần để *push* file workflow.
- Token có hạn dùng. Hết hạn hoặc lộ ra ngoài thì thu hồi trên GitHub (Settings → Developer settings → Personal access tokens) và tạo token mới, rồi ghi đè `github-token.txt`.
- Máy mới clone project sẽ không có file token; PO tự tạo lại file.
