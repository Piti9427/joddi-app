import SwiftUI

struct TransactionRow: View {
    let transaction: AppTransaction

    private var iconName: String {
        let cat = (transaction.category ?? "").lowercased()
        if cat.contains("food") { return "basket.fill" }
        if cat.contains("coffee") { return "cup.and.saucer.fill" }
        if cat.contains("salary") || cat.contains("income") { return "banknote.fill" }
        if cat.contains("transport") { return "car.fill" }
        if cat.contains("bill") { return "doc.text.fill" }
        if cat.contains("shopping") { return "bag.fill" }
        return "receipt.fill"
    }

    var body: some View {
        HStack(spacing: 14) {
            // Icon
            RoundedRectangle(cornerRadius: 14)
                .fill(transaction.isExpense ? Color.red.opacity(0.1) : Color.green.opacity(0.1))
                .frame(width: 48, height: 48)
                .overlay {
                    Image(systemName: iconName)
                        .font(.body.weight(.semibold))
                        .foregroundStyle(transaction.isExpense ? .red : .green)
                }

            // Details
            VStack(alignment: .leading, spacing: 3) {
                Text(transaction.merchant ?? transaction.category ?? "Transaction")
                    .font(.subheadline.weight(.bold))
                    .lineLimit(1)

                HStack(spacing: 4) {
                    Text(transaction.category ?? "")
                        .font(.caption2.weight(.bold))
                        .foregroundStyle(.secondary)

                    Circle()
                        .fill(.secondary.opacity(0.3))
                        .frame(width: 3, height: 3)

                    Text(transaction.date, format: .dateTime.month(.abbreviated).day())
                        .font(.caption2.weight(.bold))
                        .foregroundStyle(.secondary.opacity(0.6))
                }
            }

            Spacer()

            // Amount
            Text("\(transaction.isExpense ? "-" : "+")\(formatCurrency(transaction.amount, fractionDigits: 2))")
                .font(.subheadline.weight(.black))
                .foregroundStyle(transaction.isExpense ? .primary : .green)
                .monospacedDigit()
        }
        .padding(14)
        .background(Color(.systemBackground), in: RoundedRectangle(cornerRadius: 20))
        .shadow(color: .black.opacity(0.03), radius: 4, y: 2)
    }
}
