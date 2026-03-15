import Foundation
import Supabase
import SwiftUI

@MainActor
final class AuthViewModel: ObservableObject {
    @Published var isAuthenticated = false
    @Published var isLoading = true
    @Published var userEmail: String?
    @Published var errorMessage: String?
    @Published var successMessage: String?

    private var authListener: Task<Void, Never>?
    private var supabase: SupabaseClient { SupabaseService.shared.client }

    init() {
        listenToAuthChanges()
    }

    deinit {
        authListener?.cancel()
    }

    private func listenToAuthChanges() {
        authListener = Task {
            for await (event, session) in supabase.auth.authStateChanges {
                await MainActor.run {
                    switch event {
                    case .initialSession:
                        self.isAuthenticated = session != nil
                        self.userEmail = session?.user.email
                        self.isLoading = false
                    case .signedIn:
                        self.isAuthenticated = true
                        self.userEmail = session?.user.email
                    case .signedOut:
                        self.isAuthenticated = false
                        self.userEmail = nil
                    default:
                        break
                    }
                }
            }
        }
    }

    func signIn(email: String, password: String) async {
        errorMessage = nil
        successMessage = nil
        isLoading = true

        do {
            try await supabase.auth.signIn(
                email: email.trimmingCharacters(in: .whitespacesAndNewlines).lowercased(),
                password: password
            )
        } catch {
            errorMessage = mapError(error)
        }

        isLoading = false
    }

    func signUp(email: String, password: String) async {
        errorMessage = nil
        successMessage = nil
        isLoading = true

        do {
            try await supabase.auth.signUp(
                email: email.trimmingCharacters(in: .whitespacesAndNewlines).lowercased(),
                password: password
            )
            successMessage = "สมัครสมาชิกสำเร็จ! กรุณาเปิดอีเมลและยืนยันบัญชี"
        } catch {
            errorMessage = mapError(error)
        }

        isLoading = false
    }

    func signOut() async {
        try? await supabase.auth.signOut()
    }

    func resetPassword(email: String) async {
        errorMessage = nil
        successMessage = nil
        isLoading = true

        do {
            try await supabase.auth.resetPasswordForEmail(
                email.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
            )
            successMessage = "ส่งลิงก์รีเซ็ตรหัสผ่านแล้ว กรุณาตรวจสอบอีเมล"
        } catch {
            errorMessage = mapError(error)
        }

        isLoading = false
    }

    private func mapError(_ error: Error) -> String {
        let msg = error.localizedDescription.lowercased()
        if msg.contains("invalid login credentials") { return "อีเมลหรือรหัสผ่านไม่ถูกต้อง" }
        if msg.contains("email not confirmed") { return "ยังไม่ได้ยืนยันอีเมล กรุณาเช็กเมล" }
        if msg.contains("already registered") { return "อีเมลนี้ถูกใช้งานแล้ว" }
        if msg.contains("rate limit") { return "คุณทำรายการบ่อยเกินไป โปรดรอสักครู่" }
        if msg.contains("password") { return "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" }
        return error.localizedDescription
    }
}
