const mongoose = require('mongoose');

const BudgetLimitSchema = new mongoose.Schema({
  category: { type: String, required: true, unique: true },
  limit: { type: Number, required: true },
}, { timestamps: true });

module.exports = mongoose.model('BudgetLimit', BudgetLimitSchema);
