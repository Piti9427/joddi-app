import SwiftUI
import Supabase

struct BudgetView: View {
    @State private var budgets: [AppBudget] = []
    @State private var categories: [AppCategory] = []
    @State private var transactions: [AppTransaction] = []
    @State private var isLoading = true
    @State private var showAddBudget = false

    private var supabase: SupabaseClient { SupabaseService.shared.client }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    if budgets.isEmpty && !isLoading {
                        ContentUnavailableView("No budgets yet",
                            systemImage: "building.columns",
                            description: Text("Tap + to create your first budget"))
                    } else {
                        ForEach(budgets) { budget in
                            let spent = spentForBudget(budget)
                            let limit = budget.amountLimit
                            let categoryName = categories.first { $0.id == budget.categoryId }?.name ?? "General"

                            BudgetCard(
                                category: categoryName,
                                spent: spent,
                                limit: limit
                            )
                        }
                    }

                    Spacer().frame(height: 80)
                }
                .padding(.horizontal)
                .padding(.top, 8)
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle("Budgets")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        showAddBudget = true
                    } label: {
                        Image(systemName: "plus.circle.fill")
                            .foregroundStyle(.green)
                    }
                }
            }
            .sheet(isPresented: $showAddBudget) {
                AddBudgetView(categories: categories) {
                    Task { await loadData() }
                }
            }
            .task {
                await loadData()
            }
            .refreshable {
                await loadData()
            }
        }
    }

    private func spentForBudget(_ budget: AppBudget) -> Decimal {
        let cal = Calendar.current
        return transactions
            .filter { $0.type == .expense }
            .filter { tx in
                if let catId = budget.categoryId {
                    return tx.categoryId == catId && cal.isDate(tx.date, equalTo: budget.monthYear, toGranularity: .month)
                }
                return cal.isDate(tx.date, equalTo: budget.monthYear, toGranularity: .month)
            }
            .reduce(0) { $0 + $1.amount }
    }

    private func loadData() async {
        do {
            async let b: [AppBudget] = supabase.from("budgets").select().execute().value
            async let c: [AppCategory] = supabase.from("categories").select().execute().value
            async let t: [AppTransaction] = supabase.from("transactions").select().order("date", ascending: false).execute().value
            budgets = try await b
            categories = try await c
            transactions = try await t
            isLoading = false
        } catch {
            print("Error: \(error)")
            isLoading = false
        }
    }
}

struct BudgetCard: View {
    let category: String
    let spent: Decimal
    let limit: Decimal

    private var progress: Double {
        guard limit > 0 else { return 0 }
        return min(Double(truncating: (spent / limit) as NSDecimalNumber), 1.0)
    }

    private var isOverBudget: Bool { spent > limit }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text(category)
                    .font(.headline.bold())
                Spacer()
                Text(isOverBudget ? "OVER BUDGET" : "\(Int(progress * 100))%")
                    .font(.caption.weight(.black))
                    .foregroundStyle(isOverBudget ? .red : progress > 0.8 ? .orange : .green)
            }

            // Progress Bar
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule()
                        .fill(Color(.tertiarySystemBackground))
                        .frame(height: 10)

                    Capsule()
                        .fill(isOverBudget ? .red.gradient : progress > 0.8 ? .orange.gradient : .green.gradient)
                        .frame(width: geo.size.width * progress, height: 10)
                        .animation(.spring(duration: 0.5), value: progress)
                }
            }
            .frame(height: 10)

            HStack {
                Text("\(formatCurrency(spent)) spent")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.secondary)
                Spacer()
                Text("of \(formatCurrency(limit))")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.secondary)
            }
        }
        .padding(20)
        .background(Color(.systemBackground), in: RoundedRectangle(cornerRadius: 20))
        .shadow(color: .black.opacity(0.04), radius: 4, y: 2)
    }
}

struct AddBudgetView: View {
    @Environment(\.dismiss) private var dismiss
    let categories: [AppCategory]
    let onSaved: () -> Void

    @State private var selectedCategoryId: UUID?
    @State private var amountText = ""
    @State private var isSaving = false

    private var supabase: SupabaseClient { SupabaseService.shared.client }

    var body: some View {
        NavigationStack {
            Form {
                Section("Category") {
                    Picker("Category", selection: $selectedCategoryId) {
                        Text("General").tag(UUID?.none)
                        ForEach(categories.filter { $0.isExpense }) { cat in
                            Text(cat.name).tag(UUID?.some(cat.id))
                        }
                    }
                }

                Section("Monthly Limit") {
                    TextField("Amount", text: $amountText)
                        .keyboardType(.decimalPad)
                }
            }
            .navigationTitle("New Budget")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Save") {
                        Task { await save() }
                    }
                    .disabled(isSaving || amountText.isEmpty)
                    .font(.headline.weight(.bold))
                }
            }
        }
    }

    private func save() async {
        guard let amount = Decimal(string: amountText), amount > 0 else { return }
        isSaving = true

        struct NewBudget: Encodable {
            let category_id: UUID?
            let amount_limit: Decimal
            let month_year: String
        }

        let monthYear = Date().formatted(.iso8601.year().month().day())

        do {
            try await supabase
                .from("budgets")
                .insert(NewBudget(
                    category_id: selectedCategoryId,
                    amount_limit: amount,
                    month_year: monthYear
                ))
                .execute()

            onSaved()
            dismiss()
        } catch {
            print("Error saving budget: \(error)")
            isSaving = false
        }
    }
}
