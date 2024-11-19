function calculateCIBILScore(user) {
    const MAX_CIBIL = 900;
    const MIN_CIBIL = 300;
    let cibilScore = 600; // Start with a neutral base score

    // Destructure user object
    const {
        MonthlyIncome = 0,
        MonthlyExpend = 0,
        LoanRequest = 0,
        outstandingDebt = 0,
        totalAssets = 0,
        totalLiabilities = 0,
        loanHistory = {}
    } = user;

    // **1. New Credit Impact (15%)**
    const newCredit = (MonthlyIncome * 12) + totalAssets - ((MonthlyExpend * 12) + outstandingDebt + totalLiabilities);
    let newCreditImpact = 0.15 * MAX_CIBIL;

    // Check if new credit supports the loan request
    if (newCredit < LoanRequest) {
        cibilScore -= newCreditImpact * 0.8; // Strong penalty if new credit is less than loan request
    } else if (newCredit === LoanRequest) {
        cibilScore -= newCreditImpact * 0.4; // Moderate penalty if new credit equals loan request
    } else {
        cibilScore += newCreditImpact * 0.2; // Positive impact if new credit is greater than loan request
    }

    // **2. Repayment History Impact (35%)**
    let repaymentImpact = 0.35 * MAX_CIBIL;
    
    for (const loan of Object.values(loanHistory)) {
        for (const year in loan.regularityLack) {
            const yearData = loan.regularityLack[year];
            for (const month in yearData) {
                const value = yearData[month];
                if (value > 16) {
                    cibilScore -= repaymentImpact * 0.1; // Larger penalty for late repayments
                } else if (value === 16) {
                    cibilScore -= repaymentImpact * 0.05; // Moderate penalty
                } else if (value > 0 && value < 16) {
                    cibilScore -= repaymentImpact * 0.02; // Minor penalty
                } else if (value === 0) {
                    cibilScore += repaymentImpact * 0.1; // Positive impact for timely payments
                }
            }
        }
    }

    // **3. Credit Balance and Utilization Impact (30%)**
    let creditBalanceImpact = 0.30 * MAX_CIBIL;
    const pendingLoanAmountToBePaid = Object.values(loanHistory).reduce((acc, loan) => {
        if (loan.loanStatus === "Pending") acc += loan.LoanAmount;
        return acc;
    }, 0);

    const CBME = (pendingLoanAmountToBePaid / 12) + MonthlyExpend;

    if (CBME < MonthlyIncome) {
        cibilScore += creditBalanceImpact * 0.2; // Positive impact if credit balance is manageable
    } else if (CBME === MonthlyIncome) {
        cibilScore -= creditBalanceImpact * 0.1; // Mild penalty if credit balance equals income
    } else {
        cibilScore -= creditBalanceImpact * 0.2; // Stronger penalty if credit balance exceeds income
    }

    // **4. Duration of Awaiting Credit Impact (15%)**
    let durationImpact = 0.15 * MAX_CIBIL;
    for (const loan of Object.values(loanHistory)) {
        const endDate = new Date(loan.endDate);
        const startDate = new Date(loan.startDate);
        if (loan.loanStatus === "Paid" && endDate > startDate) {
            cibilScore += durationImpact * 0.25; // Positive impact for completed loans
        } else {
            cibilScore -= durationImpact * 0.15; // Mild penalty for pending loans
        }
    }

    // **5. Credit Mix Impact (5%)**
    let creditMixImpact = 0.05 * MAX_CIBIL;
    const liabilityRatio = totalLiabilities / newCredit;

    if (
        Object.values(loanHistory).some(
            (loan) => loan.LoanType === "Home Loan" || loan.LoanType === "Personal Loan"
        ) && liabilityRatio < 0.45
    ) {
        cibilScore += creditMixImpact * 0.5; // Positive impact for balanced credit mix
    } else {
        cibilScore -= creditMixImpact * 0.3; // Penalty for unbalanced credit mix
    }

    // **Final Score Adjustment**
    // Ensure score stays within bounds [300, 900]
    console.log(cibilScore);
    cibilScore = Math.min(MAX_CIBIL, Math.max(MIN_CIBIL, cibilScore));

    return cibilScore;
}






module.exports = { calculateCIBILScore };






module.exports = { calculateCIBILScore };