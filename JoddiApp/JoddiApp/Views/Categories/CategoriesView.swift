import SwiftUI
import Supabase

struct CategoriesView: View {
    @State private var categories: [AppCategory] = []
    @State private var isLoading = true
    @State private var showAddForm = false
    @State private var newName = ""
    @State private var newType = "Expense"

    private var supabase: SupabaseClient { SupabaseService.shared.client }

    private var expenseCategories: [AppCategory] {
        categories.filter { $0.type == "Expense" }
    }
    private var incomeCategories: [AppCategory] {
        categories.filter { $0.type == "Income" }
    }

    var body: some View {
        List {
            if !expenseCategories.isEmpty {
                Section("Expense Categories") {
                    ForEach(expenseCategories) { cat in
                        HStack {
                            Circle()
                                .fill(Color.red.opacity(0.15))
                                .frame(width: 36, height: 36)
                                .overlay {
                                    Image(systemName: "tag.fill")
                                        .font(.caption)
                                        .foregroundStyle(.red)
                                }
                            Text(cat.name)
                                .font(.subheadline.weight(.semibold))
                        }
                    }
                    .onDelete { indexSet in
                        Task { await deleteCategories(at: indexSet, from: expenseCategories) }
                    }
                }
            }

            if !incomeCategories.isEmpty {
                Section("Income Categories") {
                    ForEach(incomeCategories) { cat in
                        HStack {
                            Circle()
                                .fill(Color.green.opacity(0.15))
                                .frame(width: 36, height: 36)
                                .overlay {
                                    Image(systemName: "tag.fill")
                                        .font(.caption)
                                        .foregroundStyle(.green)
                                }
                            Text(cat.name)
                                .font(.subheadline.weight(.semibold))
                        }
                    }
                    .onDelete { indexSet in
                        Task { await deleteCategories(at: indexSet, from: incomeCategories) }
                    }
                }
            }
        }
        .navigationTitle("Categories")
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    showAddForm = true
                } label: {
                    Image(systemName: "plus.circle.fill")
                        .foregroundStyle(.green)
                }
            }
        }
        .alert("Add Category", isPresented: $showAddForm) {
            TextField("Category name", text: $newName)
            Picker("Type", selection: $newType) {
                Text("Expense").tag("Expense")
                Text("Income").tag("Income")
            }
            Button("Add") {
                Task { await addCategory() }
            }
            Button("Cancel", role: .cancel) {}
        }
        .task {
            await loadCategories()
        }
    }

    private func loadCategories() async {
        do {
            let result: [AppCategory] = try await supabase
                .from("categories")
                .select()
                .order("created_at", ascending: true)
                .execute()
                .value
            categories = result
            isLoading = false
        } catch {
            print("Error: \(error)")
            isLoading = false
        }
    }

    private func addCategory() async {
        guard !newName.isEmpty else { return }

        struct NewCategory: Encodable {
            let name: String
            let type: String
        }

        do {
            try await supabase
                .from("categories")
                .insert(NewCategory(name: newName, type: newType))
                .execute()
            newName = ""
            await loadCategories()
        } catch {
            print("Error: \(error)")
        }
    }

    private func deleteCategories(at offsets: IndexSet, from list: [AppCategory]) async {
        for index in offsets {
            let cat = list[index]
            do {
                try await supabase
                    .from("categories")
                    .delete()
                    .eq("id", value: cat.id.uuidString)
                    .execute()
            } catch {
                print("Error deleting: \(error)")
            }
        }
        await loadCategories()
    }
}
