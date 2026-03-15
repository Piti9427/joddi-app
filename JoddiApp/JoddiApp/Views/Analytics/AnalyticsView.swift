import SwiftUI
import Supabase

struct AnalyticsView: View {
    @State private var transactions: [AppTransaction] = []
    @State private var timeRange: TimeRange = .month
    @State private var isLoading = true

    private var supabase: SupabaseClient { SupabaseService.shared.client }

    enum TimeRange: String, CaseIterable {
        case week = "Week"
        case month = "Month"
        case year = "Year"
    }

    private var filteredTransactions: [AppTransaction] {
        let cal = Calendar.current
        let now = Date()
        return transactions.filter { tx in
            switch timeRange {
            case .week: return cal.isDate(tx.date, equalTo: now, toGranularity: .weekOfYear)
            case .month: return cal.isDate(tx.date, equalTo: now, toGranularity: .month)
            case .year: return cal.isDate(tx.date, equalTo: now, toGranularity: .year)
            }
        }
    }

    private var totalIncome: Decimal { filteredTransactions.filter { $0.type == .income }.reduce(0) { $0 + $1.amount } }
    private var totalExpense: Decimal { filteredTransactions.filter { $0.type == .expense }.reduce(0) { $0 + $1.amount } }

    private var categoryBreakdown: [(String, Decimal, Color)] {
        let expenses = filteredTransactions.filter { $0.type == .expense }
        let grouped = Dictionary(grouping: expenses) { $0.category ?? "Other" }
        let colors: [Color] = [.green, .blue, .orange, .purple, .pink, .cyan, .yellow, .red]
        return grouped.map { (key, txs) in
            let total = txs.reduce(Decimal(0)) { $0 + $1.amount }
            let colorIndex = abs(key.hashValue) % colors.count
            return (key, total, colors[colorIndex])
        }.sorted { $0.1 > $1.1 }
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    // Time Range Picker
                    Picker("Range", selection: $timeRange) {
                        ForEach(TimeRange.allCases, id: \.self) { range in
                            Text(range.rawValue).tag(range)
                        }
                    }
                    .pickerStyle(.segmented)
                    .padding(.horizontal)

                    // Income vs Expense Summary
                    HStack(spacing: 12) {
                        StatCard(title: "Income", amount: totalIncome, color: .green, icon: "arrow.up.right")
                        StatCard(title: "Expense", amount: totalExpense, color: .red, icon: "arrow.down.right")
                    }
                    .padding(.horizontal)

                    // Donut Chart
                    if !categoryBreakdown.isEmpty {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Expense Breakdown")
                                .font(.headline.bold())
                                .padding(.horizontal)

                            DonutChartView(data: categoryBreakdown, total: totalExpense)
                                .frame(height: 220)
                                .padding(.horizontal)

                            // Legend
                            VStack(spacing: 8) {
                                ForEach(categoryBreakdown, id: \.0) { item in
                                    HStack {
                                        Circle()
                                            .fill(item.2)
                                            .frame(width: 10, height: 10)
                                        Text(item.0)
                                            .font(.caption.weight(.semibold))
                                        Spacer()
                                        Text(formatCurrency(item.1))
                                            .font(.caption.weight(.black))
                                            .monospacedDigit()
                                    }
                                }
                            }
                            .padding()
                            .background(Color(.systemBackground), in: RoundedRectangle(cornerRadius: 16))
                            .padding(.horizontal)
                        }
                    }

                    Spacer().frame(height: 80)
                }
                .padding(.top, 8)
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle("Cashflow")
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
            print("Error: \(error)")
            isLoading = false
        }
    }
}

struct StatCard: View {
    let title: String
    let amount: Decimal
    let color: Color
    let icon: String

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: icon)
                    .font(.caption)
                Text(title.uppercased())
                    .font(.caption2.weight(.black))
            }
            .foregroundStyle(color)

            Text(formatCurrency(amount))
                .font(.title3.weight(.black))
                .monospacedDigit()
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .background(Color(.systemBackground), in: RoundedRectangle(cornerRadius: 20))
        .shadow(color: .black.opacity(0.04), radius: 4, y: 2)
    }
}

// MARK: - Donut Chart
struct DonutChartView: View {
    let data: [(String, Decimal, Color)]
    let total: Decimal

    var body: some View {
        ZStack {
            ForEach(Array(slices.enumerated()), id: \.offset) { _, slice in
                DonutSlice(startAngle: slice.start, endAngle: slice.end)
                    .fill(slice.color)
            }

            // Center label
            VStack(spacing: 2) {
                Text("Total")
                    .font(.caption.weight(.medium))
                    .foregroundStyle(.secondary)
                Text(formatCurrency(total))
                    .font(.title3.weight(.black))
            }
        }
    }

    private var slices: [(start: Angle, end: Angle, color: Color)] {
        guard total > 0 else { return [] }
        var result: [(start: Angle, end: Angle, color: Color)] = []
        var currentAngle = Angle.degrees(-90)
        for item in data {
            let fraction = Double(truncating: (item.1 / total) as NSDecimalNumber)
            let sliceAngle = Angle.degrees(fraction * 360)
            result.append((currentAngle, currentAngle + sliceAngle, item.2))
            currentAngle += sliceAngle
        }
        return result
    }
}

struct DonutSlice: Shape {
    let startAngle: Angle
    let endAngle: Angle

    func path(in rect: CGRect) -> Path {
        let center = CGPoint(x: rect.midX, y: rect.midY)
        let outerRadius = min(rect.width, rect.height) / 2
        let innerRadius = outerRadius * 0.6
        var path = Path()
        path.addArc(center: center, radius: outerRadius, startAngle: startAngle, endAngle: endAngle, clockwise: false)
        path.addArc(center: center, radius: innerRadius, startAngle: endAngle, endAngle: startAngle, clockwise: true)
        path.closeSubpath()
        return path
    }
}
