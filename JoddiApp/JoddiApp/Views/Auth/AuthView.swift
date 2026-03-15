import SwiftUI

struct AuthView: View {
    @EnvironmentObject var authVM: AuthViewModel
    @State private var isLogin = true
    @State private var email = ""
    @State private var password = ""

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                Spacer().frame(height: 40)

                // Logo
                ZStack {
                    RoundedRectangle(cornerRadius: 24)
                        .fill(.green.gradient)
                        .frame(width: 64, height: 64)
                        .rotationEffect(.degrees(12))
                        .shadow(color: .green.opacity(0.3), radius: 12)

                    Image(systemName: "wallet.bifold.fill")
                        .font(.system(size: 28))
                        .foregroundStyle(.white)
                }

                // Title
                VStack(spacing: 8) {
                    Text(isLogin ? "Welcome back" : "Create account")
                        .font(.largeTitle.bold())

                    Text(isLogin ? "ล็อกอินเพื่อเข้าถึงข้อมูลส่วนตัว" : "สมัครสมาชิกแล้วเริ่มติดตามการเงินได้ทันที")
                        .font(.subheadline.weight(.medium))
                        .foregroundStyle(.secondary)
                }

                // Error / Success Messages
                if let error = authVM.errorMessage {
                    HStack {
                        Image(systemName: "exclamationmark.triangle.fill")
                        Text(error)
                    }
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.red)
                    .padding()
                    .frame(maxWidth: .infinity)
                    .background(.red.opacity(0.1), in: RoundedRectangle(cornerRadius: 16))
                }

                if let success = authVM.successMessage {
                    HStack {
                        Image(systemName: "checkmark.circle.fill")
                        Text(success)
                    }
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.green)
                    .padding()
                    .frame(maxWidth: .infinity)
                    .background(.green.opacity(0.1), in: RoundedRectangle(cornerRadius: 16))
                }

                // Input Fields
                VStack(spacing: 12) {
                    HStack(spacing: 12) {
                        Image(systemName: "envelope.fill")
                            .foregroundStyle(.secondary)
                            .frame(width: 20)
                        TextField("Email address", text: $email)
                            .keyboardType(.emailAddress)
                            .textContentType(.emailAddress)
                            .autocapitalization(.none)
                            .disableAutocorrection(true)
                    }
                    .padding()
                    .background(Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 16))

                    HStack(spacing: 12) {
                        Image(systemName: "lock.fill")
                            .foregroundStyle(.secondary)
                            .frame(width: 20)
                        SecureField("Password", text: $password)
                            .textContentType(isLogin ? .password : .newPassword)
                    }
                    .padding()
                    .background(Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 16))
                }

                // Submit Button
                Button {
                    Task {
                        if isLogin {
                            await authVM.signIn(email: email, password: password)
                        } else {
                            await authVM.signUp(email: email, password: password)
                        }
                    }
                } label: {
                    HStack {
                        Text(isLogin ? "Sign In" : "Sign Up")
                            .font(.headline.weight(.bold))
                        Image(systemName: "arrow.right")
                    }
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(.primary, in: RoundedRectangle(cornerRadius: 16))
                }
                .disabled(authVM.isLoading)
                .opacity(authVM.isLoading ? 0.7 : 1)

                // Forgot Password
                if isLogin {
                    Button("Forgot Password?") {
                        Task { await authVM.resetPassword(email: email) }
                    }
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.secondary)
                    .padding(.vertical, 8)
                    .padding(.horizontal, 16)
                    .background(Color(.tertiarySystemBackground), in: RoundedRectangle(cornerRadius: 12))
                }

                // Toggle Login <-> Signup
                Button {
                    withAnimation {
                        isLogin.toggle()
                        authVM.errorMessage = nil
                        authVM.successMessage = nil
                    }
                } label: {
                    HStack(spacing: 4) {
                        Text(isLogin ? "Don't have an account?" : "Already have an account?")
                            .foregroundStyle(.secondary)
                        Text(isLogin ? "Sign up" : "Log in")
                            .foregroundStyle(.green)
                            .underline()
                    }
                    .font(.subheadline.weight(.medium))
                }

                Spacer()
            }
            .padding(.horizontal, 24)
        }
        .background(Color(.systemBackground))
    }
}
