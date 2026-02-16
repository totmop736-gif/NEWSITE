const { toRuDateString, weeksBetween, overdueWeeksCeil } = require("../utils/dateUtils");

class RentCheckService {
  constructor({ clientRepository }) {
    this.clientRepository = clientRepository;
  }

  async checkRent(query, now = new Date()) {
    const client = await this.clientRepository.findByNameOrCode(query);
    if (!client) {
      return null;
    }

    const weeksPassed = weeksBetween(client.startDate, now);
    const weeksPaid = weeksBetween(client.startDate, client.paidUntilDate);

    // Business rule: any started overdue week is billed as a full week.
    const weeksToPay = overdueWeeksCeil(client.paidUntilDate, now);
    const debt = weeksToPay * client.weeklyPrice;

    return {
      fullName: client.fullName,
      bikeNumber: client.bikeNumber,
      startDate: toRuDateString(client.startDate),
      paidUntilDate: toRuDateString(client.paidUntilDate),
      weeklyPrice: client.weeklyPrice,
      weeksPassed,
      weeksPaid,
      weeksToPay,
      debt
    };
  }
}

module.exports = {
  RentCheckService
};
