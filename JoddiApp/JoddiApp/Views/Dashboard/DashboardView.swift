import SwiftUI
import Supabase

struct DashboardView: View {
    @Binding var showAddTransaction: Bool
    @EnvironmentObject var authVM: AuthViewModel
    @State private var transactions: [AppTransaction] = []
    @State private var isLoading = true

    private var supabase: SupabaseClient { SupabaseService.shared.client }

    // MARK: - Computed
    private var totalIncome: Decimal {
        transactions.filter { $0.type == .income }.reduce(0) { $0 + $1.amount }
    }
    private var totalExpense: Decimal {
        transactions.filter { $0.type == .expense }.reduce(0) { $0 + $1.amount }
    }
    private var balance: Decimal { totalIncome - totalExpense }

    private var todayTransactions: [AppTransaction] {
        transactions.filter { Calendar.current.isDateInToday($0.date) }
    }
    private var todayIncome: Decimal {
        todayTransactions.filter { $0.type == .income }.reduce(0) { $0 + $1.amount }
    }
    private var todayExpense: Decimal {
        todayTransactions.filter { $0.type == .expense }.reduce(0) { $0 + $1.amount }
    }

    private var monthTransactions: [AppTransaction] {
        let cal = Calendar.current
        let now = Date()
        return transactions.filter { cal.isDate($0.date, equalTo: now, toGranularity: .month) }
    }
    private var monthIncome: Decimal { monthTransactions.filter { $0.type == .income }.reduce(0) { $0 + $1.amount } }
    private var monthExpense: Decimal { monthTransactions.filter { $0.type == .expense }.reduce(0) { $0 + $1.amount } }
    private var monthNet: Decimal { monthIncome - monthExpense }

    private var recentTransactions: [AppTransaction] {
        Array(transactions.prefix(5))
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    // Balance Card
                    BalanceCardView(
                        balance: balance,
                        totalIncome: totalIncome,
                        totalExpense: totalExpense
                    )
                    .padding(.horizontal)

                    // Quick Actions
                    HStack(spacing: 12) {
                        QuickActionButton(icon: "plus", label: "Expense") {
                            showAddTransaction = true
                        }
                        QuickActionButton(icon: "arrow.up.right", label: "Income") {
                            showAddTransaction = true
                        }
                        QuickActionButton(icon: "chart.pie", label: "Analytics") {}
                    }
                    .padding(.horizontal)

                    // Today Summary
                    HStack(spacing: 12) {
                        SummaryCard(title: "TODAY IN", amount: todayIncome, color: .green, icon: "arrow.up.right")
                        SummaryCard(title: "TODAY OUT", amount: todayExpense, color: .red, icon: "arrow.down.right")
                    }
                    .padding(.horizontal)

                    // Monthly Summary
                    MonthlySummaryCard(
                        net: monthNet,
                        income: monthIncome,
                        expense: monthExpense
                    )
                    .padding(.horizontal)

                    // Recent Activity
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Text("Recent Activity")
                                .font(.title3.bold())
                            Spacer()
                            Button("See all →") {}
                                .font(.caption.weight(.bold))
                                .foregroundStyle(.green)
                        }
                        .padding(.horizontal)

                        if recentTransactions.isEmpty {
                            EmptyStateView()
                        } else {
                            ForEach(recentTransactions) { tx in
                                TransactionRow(transaction: tx)
                            }
                            .padding(.horizontal)
                        }
                    }
                    .padding(.top, 8)

                    Spacer().frame(height: 80) // Tab bar clearance
                }
                .padding(.top, 8)
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle("")
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    HStack(spacing: 12) {
                        Circle()
                            .fill(.green.opacity(0.15))
                            .frame(width: 40, height: 40)
                            .overlay {
                                Image(systemName: "person.fill")
                                    .foregroundStyle(.green)
                            }

                        VStack(alignment: .leading, spacing: 2) {
                            Text(Date(), format: .dateTime.weekday(.abbreviated).month(.abbreviated).day())
                                .font(.caption2.weight(.bold))
                                .foregroundStyle(.secondary)
                                .textCase(.uppercase)
                            Text("Financial Overview")
                                .font(.subheadline.bold())
                        }
                    }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    HStack(spacing: 4) {
                        Button { } label: {
                            Image(systemName: "bell.fill")
                                .padding(8)
                                .background(Color(.tertiarySystemBackground), in: Circle())
                        }
                        NavigationLink {
                            SettingsView()
                        } label: {
                            Image(systemName: "gearshape.fill")
                                .padding(8)
                                .background(Color(.tertiarySystemBackground), in: Circle())
                        }
                    }
                    .foregroundStyle(.secondary)
                }
            }
            .task {
                await loadTransactions()
            }
            .refreshable {
                await loadTransactions()
            }
        }
    }

    private func loadTransactions() async {
        do {
            let result: [AppTransaction] = try await supabase
                .from("transactions")
                .select()
                .order("date", ascending: false)
                .execute()
                .value
            transactions = result
            isLoading = false
        } catch {
            print("Error loading transactions: \(error)")
            isLoading = false
        }
    }
}

// MARK: - Sub components

struct BalanceCardView: View {
    let balance: Decimal
    let totalIncome: Decimal
    let totalExpense: Decimal

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("AVAILABLE BALANCE")
                    .font(.caption.weight(.bold))
                    .foregroundStyle(.white.opacity(0.75))
                Spacer()
                Image(systemName: "creditcard.fill")
                    .foregroundStyle(.white.opacity(0.3))
            }

            Text(formatCurrency(balance))
                .font(.system(size: 36, weight: .black, design: .rounded))
                .foregroundStyle(.white)

            Divider().background(.white.opacity(0.2))

            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    HStack(spacing: 4) {
                        Image(systemName: "arrow.up.right")
                            .font(.caption2)
                        Text("TOTAL INCOME")
                            .font(.caption2.weight(.bold))
                    }
                    .foregroundStyle(.white.opacity(0.65))
                    Text(formatCurrency(totalIncome))
                        .font(.headline.weight(.bold))
                        .foregroundStyle(.white)
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 4) {
                    HStack(spacing: 4) {
                        Image(systemName: "arrow.down.right")
                            .font(.caption2)
                        Text("TOTAL EXPENSE")
                            .font(.caption2.weight(.bold))
                    }
                    .foregroundStyle(.white.opacity(0.65))
                    Text(formatCurrency(totalExpense))
                        .font(.headline.weight(.bold))
                        .foregroundStyle(.white)
                }
            }
        }
        .padding(24)
        .background(
            LinearGradient(
                colors: [.green, .green.opacity(0.8), Color(red: 0.05, green: 0.5, blue: 0.3)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .clipShape(RoundedRectangle(cornerRadius: 28))
        )
        .shadow(color: .green.opacity(0.25), radius: 16, y: 8)
    }
}

struct QuickActionButton: View {
    let icon: String
    let label: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 6) {
                Image(systemName: icon)
                    .font(.body.weight(.semibold))
                    .foregroundStyle(.green)
                Text(label)
                    .font(.caption2.weight(.black))
                    .textCase(.uppercase)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
            .background(Color(.systemBackground), in: RoundedRectangle(cornerRadius: 16))
            .shadow(color: .black.opacity(0.04), radius: 4, y: 2)
        }
        .foregroundStyle(.primary)
    }
}

struct SummaryCard: View {
    let title: String
    let amount: Decimal
    let color: Color
    let icon: String

    var body: some View {
        HStack(spacing: 12) {
            Circle()
                .fill(color.opacity(0.12))
                .frame(width: 40, height: 40)
                .overlay {
                    Image(systemName: icon)
                        .font(.body.weight(.semibold))
                        .foregroundStyle(color)
                }

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.caption2.weight(.bold))
                    .foregroundStyle(.secondary)
                Text(formatCurrency(amount))
                    .font(.subheadline.weight(.bold))
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .background(Color(.systemBackground), in: RoundedRectangle(cornerRadius: 20))
        .shadow(color: .black.opacity(0.04), radius: 4, y: 2)
    }
}

struct MonthlySummaryCard: View {
    let net: Decimal
    let income: Decimal
    let expense: Decimal

    private var spendRate: Double {
        guard income > 0 else { return 0 }
        return Double(truncating: (expense / income * 100) as NSDecimalNumber)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("THIS MONTH")
                        .font(.caption2.weight(.black))
                        .foregroundStyle(.secondary)
                    Text(formatCurrency(net))
                        .font(.title3.weight(.black))
                }
                Spacer()
                Text(net >= 0 ? "POSITIVE FLOW" : "NEGATIVE FLOW")
                    .font(.caption2.weight(.black))
                    .foregroundStyle(net >= 0 ? .green : .red)
            }

            VStack(spacing: 6) {
                MetricRowView(label: "INCOME", value: formatCurrency(income), color: .green)
                MetricRowView(label: "EXPENSE", value: formatCurrency(expense), color: .primary)
                MetricRowView(label: "SPEND / INCOME", value: "\(Int(spendRate))%", color: spendRate > 80 ? .orange : .primary)
            }
        }
        .padding(20)
        .background(Color(.systemBackground), in: RoundedRectangle(cornerRadius: 24))
        .shadow(color: .black.opacity(0.04), radius: 4, y: 2)
    }
}

struct MetricRowView: View {
    let label: String
    let value: String
    let color: Color

    var body: some View {
        HStack {
            Text(label)
                .font(.caption.weight(.bold))
                .foregroundStyle(.secondary)
            Spacer()
            Text(value)
                .font(.caption.weight(.black))
                .foregroundStyle(color)
        }
    }
}

struct EmptyStateView: View {
    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: "doc.text")
                .font(.system(size: 32))
                .foregroundStyle(.secondary)
            Text("No transactions yet")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 40)
        .background(Color(.systemBackground).opacity(0.5), in: RoundedRectangle(cornerRadius: 24))
        .padding(.horizontal)
    }
}

// MARK: - Helpers
func formatCurrency(_ value: Decimal, fractionDigits: Int = 0) -> String {
    let formatter = NumberFormatter()
    formatter.numberStyle = .currency
    formatter.currencyCode = "USD"
    formatter.maximumFractionDigits = fractionDigits
    return formatter.string(from: value as NSDecimalNumber) ?? "$0"
}
