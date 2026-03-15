import SwiftUI

@main
struct JoddiApp: App {
    @StateObject private var authVM = AuthViewModel()
    @AppStorage("isDarkMode") private var isDarkMode = false

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(authVM)
                .preferredColorScheme(isDarkMode ? .dark : .light)
        }
    }
}
