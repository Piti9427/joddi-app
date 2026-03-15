import SwiftUI

struct ContentView: View {
    @EnvironmentObject var authVM: AuthViewModel

    var body: some View {
        Group {
            if authVM.isLoading {
                // Splash / Loading
                ZStack {
                    Color(.systemBackground).ignoresSafeArea()
                    VStack(spacing: 16) {
                        Image(systemName: "wallet.bifold.fill")
                            .font(.system(size: 48))
                            .foregroundStyle(.green)
                            .rotationEffect(.degrees(12))
                        Text("JoddiApp")
                            .font(.title2.bold())
                        ProgressView()
                    }
                }
            } else if authVM.isAuthenticated {
                MainTabView()
            } else {
                AuthView()
            }
        }
        .animation(.easeInOut(duration: 0.3), value: authVM.isAuthenticated)
        .animation(.easeInOut(duration: 0.3), value: authVM.isLoading)
    }
}

// MARK: - Main Tab View
struct MainTabView: View {
    @State private var selectedTab = 0
    @State private var showAddTransaction = false

    var body: some View {
        ZStack(alignment: .bottom) {
            TabView(selection: $selectedTab) {
                DashboardView(showAddTransaction: $showAddTransaction)
                    .tag(0)

                TransactionListView()
                    .tag(1)

                // Placeholder for center button
                Color.clear
                    .tag(2)

                AnalyticsView()
                    .tag(3)

                BudgetView()
                    .tag(4)
            }

            // Custom Tab Bar
            CustomTabBar(selectedTab: $selectedTab, showAddTransaction: $showAddTransaction)
        }
        .sheet(isPresented: $showAddTransaction) {
            AddTransactionView()
        }
    }
}

// MARK: - Custom Tab Bar
struct CustomTabBar: View {
    @Binding var selectedTab: Int
    @Binding var showAddTransaction: Bool

    var body: some View {
        HStack {
            TabBarButton(icon: "house.fill", label: "Home", isActive: selectedTab == 0) {
                selectedTab = 0
            }

            TabBarButton(icon: "list.bullet.rectangle.fill", label: "Activity", isActive: selectedTab == 1) {
                selectedTab = 1
            }

            // Center FAB
            Button {
                showAddTransaction = true
            } label: {
                ZStack {
                    Circle()
                        .fill(.green.gradient)
                        .frame(width: 52, height: 52)
                        .shadow(color: .green.opacity(0.3), radius: 8, y: 4)

                    Image(systemName: "plus")
                        .font(.title2.weight(.bold))
                        .foregroundStyle(.white)
                }
            }
            .offset(y: -16)

            TabBarButton(icon: "chart.pie.fill", label: "Stats", isActive: selectedTab == 3) {
                selectedTab = 3
            }

            TabBarButton(icon: "building.columns.fill", label: "Budget", isActive: selectedTab == 4) {
                selectedTab = 4
            }
        }
        .padding(.horizontal, 8)
        .padding(.top, 8)
        .padding(.bottom, 4)
        .background(
            Rectangle()
                .fill(.ultraThinMaterial)
                .shadow(color: .black.opacity(0.08), radius: 12, y: -4)
                .ignoresSafeArea(edges: .bottom)
        )
    }
}

struct TabBarButton: View {
    let icon: String
    let label: String
    let isActive: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 4) {
                Image(systemName: icon)
                    .font(.system(size: 20, weight: isActive ? .semibold : .regular))

                Text(label)
                    .font(.system(size: 10, weight: .semibold))
            }
            .foregroundStyle(isActive ? .green : .secondary)
            .frame(maxWidth: .infinity)
        }
    }
}
