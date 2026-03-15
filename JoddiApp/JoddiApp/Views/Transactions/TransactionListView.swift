import SwiftUI
import Supabase

struct TransactionListView: View {
    @State private var transactions: [AppTransaction] = []
    @State private var searchText = ""
    @State private var isLoading = true

    private var supabase: SupabaseClient { SupabaseService.shared.client }

    private var filteredTransactions: [AppTransaction] {
        guard !searchText.isEmpty else { return transactions }
        return transactions.filter {
            ($0.merchant ?? "").localizedCaseInsensitiveContains(searchText) ||
            ($0.category ?? "").localizedCaseInsensitiveContains(searchText)
        }
    }

    private var groupedByDate: [(String, [AppTransaction])] {
        let grouped = Dictionary(grouping: filteredTransactions) {
            Calendar.current.startOfDay(for: $0.date)
        }
        return grouped.sorted { $0.key > $1.key }.map { (formatDateHeader($0.key), $0.value) }
    }

    var body: some View {
        NavigationStack {
            List {
                ForEach(groupedByDate, id: \.0) { header, txs in
                    Section {
                        ForEach(txs) { tx in
                            TransactionRow(transaction: tx)
                                .listRowInsets(EdgeInsets(top: 4, leading: 16, bottom: 4, trailing: 16))
                                .listRowSeparator(.hidden)
                                .listRowBackground(Color.clear)
                        }
                    } header: {
                        Text(header)
                            .font(.caption.weight(.black))
                            .foregroundStyle(.secondary)
                            .textCase(.uppercase)
                    }
                }
            }
            .listStyle(.plain)
            .searchable(text: $searchText, prompt: "Search by merchant or category...")
            .navigationTitle("Activity")
            .overlay {
                if isLoading {
                    ProgressView()
                } else if filteredTransactions.isEmpty {
                    ContentUnavailableView("No transactions",
                        systemImage: "doc.text",
                        description: Text("Your transactions will appear here"))
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
            print("Error: \(error)")
            isLoading = false
        }
    }

    private func formatDateHeader(_ date: Date) -> String {
        if Calendar.current.isDateInToday(date) { return "Today" }
        if Calendar.current.isDateInYesterday(date) { return "Yesterday" }
        return date.formatted(.dateTime.weekday(.abbreviated).month(.abbreviated).day())
    }
}
