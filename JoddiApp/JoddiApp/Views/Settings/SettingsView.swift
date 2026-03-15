import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var authVM: AuthViewModel
    @AppStorage("isDarkMode") private var isDarkMode = false

    var body: some View {
        List {
            // Profile Section
            Section {
                HStack(spacing: 16) {
                    Circle()
                        .fill(.green.gradient)
                        .frame(width: 56, height: 56)
                        .overlay {
                            Text(authVM.userEmail?.prefix(1).uppercased() ?? "?")
                                .font(.title2.weight(.black))
                                .foregroundStyle(.white)
                        }

                    VStack(alignment: .leading, spacing: 4) {
                        Text(authVM.userEmail?.components(separatedBy: "@").first ?? "User")
                            .font(.headline.bold())
                        Text(authVM.userEmail ?? "")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }

                    Spacer()
                    Image(systemName: "chevron.right")
                        .foregroundStyle(.secondary.opacity(0.5))
                }
                .padding(.vertical, 4)
            }

            // Preferences
            Section("Preferences") {
                Toggle(isOn: $isDarkMode) {
                    HStack(spacing: 12) {
                        Image(systemName: "moon.fill")
                            .foregroundStyle(.purple)
                        Text("Dark Mode")
                    }
                }
                .tint(.green)

                HStack {
                    Image(systemName: "globe")
                        .foregroundStyle(.blue)
                    Text("Currency")
                    Spacer()
                    Text("Auto")
                        .foregroundStyle(.secondary)
                }

                HStack {
                    Image(systemName: "bell.fill")
                        .foregroundStyle(.orange)
                    Text("Notifications")
                    Spacer()
                    Image(systemName: "chevron.right")
                        .foregroundStyle(.secondary.opacity(0.5))
                }
            }

            // Data
            Section("Data") {
                NavigationLink {
                    CategoriesView()
                } label: {
                    HStack(spacing: 12) {
                        Image(systemName: "tag.fill")
                            .foregroundStyle(.green)
                        Text("Manage Categories")
                    }
                }
            }

            // Account
            Section {
                Button(role: .destructive) {
                    Task { await authVM.signOut() }
                } label: {
                    HStack {
                        Image(systemName: "rectangle.portrait.and.arrow.right")
                        Text("Sign Out")
                    }
                    .frame(maxWidth: .infinity)
                }
            }

            // App Info
            Section {
                HStack {
                    Spacer()
                    VStack(spacing: 4) {
                        Text("JoddiApp")
                            .font(.caption.weight(.bold))
                        Text("v2.0.0 • SwiftUI Native")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                    Spacer()
                }
            }
            .listRowBackground(Color.clear)
        }
        .navigationTitle("Settings")
    }
}
