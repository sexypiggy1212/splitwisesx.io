document.addEventListener('DOMContentLoaded', function() {
    const entryPage = document.getElementById('entry-page');
    const mainPage = document.getElementById('main-page');
    const participantsContainer = document.getElementById('participants-container');
    const confirmParticipantsBtn = document.getElementById('confirm-participants');
    const payerSelection = document.getElementById('payer-selection');
    const participantsSelection = document.getElementById('participants-selection');
    const addExpenseBtn = document.getElementById('add-expense');
    const calculateSettlementBtn = document.getElementById('calculate-settlement');
    const expensesList = document.getElementById('expenses-list');
    const settlementList = document.getElementById('settlement-list');

    let participants = [];
    let expenses = [];

    function addParticipantInput(afterElement) {
        const inputGroup = document.createElement('div');
        inputGroup.classList.add('input-group');
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Name';

        const actionButtons = document.createElement('div');
        actionButtons.classList.add('action-buttons');

        const addButton = document.createElement('button');
        addButton.textContent = '+';
        addButton.addEventListener('click', () => {
            addParticipantInput(inputGroup);
        });

        const removeButton = document.createElement('button');
        removeButton.textContent = '-';
        removeButton.addEventListener('click', () => {
            inputGroup.remove();
        });

        actionButtons.appendChild(addButton);
        actionButtons.appendChild(removeButton);
        inputGroup.appendChild(input);
        inputGroup.appendChild(actionButtons);

        if (afterElement) {
            participantsContainer.insertBefore(inputGroup, afterElement.nextSibling);
        } else {
            participantsContainer.appendChild(inputGroup);
        }
    }

    confirmParticipantsBtn.addEventListener('click', () => {
        participants = [];
        const inputs = participantsContainer.querySelectorAll('input');
        inputs.forEach(input => {
            if (input.value.trim() !== '') {
                participants.push(input.value.trim());
            }
        });

        if (participants.length > 0) {
            entryPage.classList.add('hidden');
            mainPage.classList.remove('hidden');
            setupParticipantSelection();
        } else {
            alert('Please add at least one participant.');
        }
    });

    function setupParticipantSelection() {
        payerSelection.innerHTML = '';
        participantsSelection.innerHTML = '';
        participants.forEach(participant => {
            const payerBox = createSelectionBox(participant, 'payer');
            payerSelection.appendChild(payerBox);

            const participantBox = createSelectionBox(participant, 'participant');
            participantsSelection.appendChild(participantBox);
        });
    }

    function createSelectionBox(name, type) {
        const box = document.createElement('div');
        box.classList.add('selection-box');
        box.textContent = name;

        if (type === 'participant') {
            const proportionInput = document.createElement('input');
            proportionInput.type = 'number';
            proportionInput.classList.add('proportion-input');
            proportionInput.value = 0;
            proportionInput.min = 0;
            proportionInput.step = 1;
            proportionInput.disabled = true; // Initially disable

            const container = document.createElement('div');
            container.classList.add('participant-box');
            container.appendChild(proportionInput);
            container.appendChild(box);

            box.addEventListener('click', () => {
                box.classList.toggle('selected');
                if (box.classList.contains('selected')) {
                    proportionInput.value = 1;
                    proportionInput.disabled = false;
                } else {
                    proportionInput.value = 0;
                    proportionInput.disabled = true;
                }
            });

            return container;
        } else {
            box.addEventListener('click', () => {
                document.querySelectorAll('.selection-box.payer-selected').forEach(box => {
                    box.classList.remove('payer-selected');
                });
                box.classList.add('payer-selected');
            });
        }

        return box;
    }

    addExpenseBtn.addEventListener('click', () => {
        const expenseName = document.getElementById('expense-name').value.trim();
        const amount = parseFloat(document.getElementById('amount').value.trim());
        const payer = document.querySelector('.selection-box.payer-selected');
        const participantsSelected = Array.from(document.querySelectorAll('#participants-selection .selection-box.selected'));

        if (expenseName && !isNaN(amount) && amount > 0 && payer && participantsSelected.length > 0) {
            const participantProportions = participantsSelected.map(box => {
                const proportionInput = box.parentElement.querySelector('.proportion-input');
                return {
                    name: box.textContent,
                    proportion: parseFloat(proportionInput.value)
                };
            });

            const expense = {
                name: expenseName,
                amount: amount,
                payer: payer.textContent,
                participants: participantProportions
            };

            expenses.push(expense);
            displayExpenses();

            document.getElementById('expense-name').value = '';
            document.getElementById('amount').value = '';
            document.querySelectorAll('.selection-box').forEach(box => {
                box.classList.remove('payer-selected');
                box.classList.remove('selected');
                const proportionInput = box.parentElement.querySelector('.proportion-input');
                if (proportionInput) {
                    proportionInput.value = 0;
                    proportionInput.disabled = true; // Disable again
                }
            });

            document.getElementById('amount').scrollIntoView({ behavior: 'smooth' });
        } else {
            alert('Please fill all fields and select payer and participants.');
        }
    });

    function displayExpenses() {
        expensesList.innerHTML = '';
        expenses.forEach((expense, index) => {
            const li = document.createElement('li');
            li.classList.add('expense-item');
    
            const expenseDetails = document.createElement('div');
            expenseDetails.classList.add('expense-details');
    
            const nameLine = document.createElement('div');
            nameLine.textContent = expense.name;
            nameLine.classList.add('title');
    
            const detailLine = document.createElement('div');
            const participantsString = expense.participants.map(p => `${p.name} (${p.proportion})`).join(', ');
            detailLine.textContent = `${expense.payer} paid $${expense.amount} for ${participantsString}`;
    
            expenseDetails.appendChild(nameLine);
            expenseDetails.appendChild(detailLine);
    
            const removeButton = document.createElement('button');
            removeButton.textContent = 'X';
            removeButton.classList.add('remove-expense-button');
            removeButton.addEventListener('click', () => {
                removeExpense(index);
            });
    
            li.appendChild(expenseDetails);
            li.appendChild(removeButton);
            expensesList.appendChild(li);
        });
    }

    function removeExpense(index) {
        expenses.splice(index, 1);
        displayExpenses();
    }

    calculateSettlementBtn.addEventListener('click', () => {
        const settlement = calculateSettlement();
        displaySettlement(settlement);
    });

    function calculateSettlement() {
        const balances = {};
        participants.forEach(participant => {
            balances[participant] = 0;
        });

        expenses.forEach(expense => {
            const totalProportion = expense.participants.reduce((sum, p) => sum + p.proportion, 0);
            const amountPerProportion = expense.amount / totalProportion;

            expense.participants.forEach(participant => {
                balances[participant.name] -= amountPerProportion * participant.proportion;
            });

            balances[expense.payer] += expense.amount;
        });

        const settlement = [];
        const creditors = Object.keys(balances).filter(p => balances[p] > 0);
        const debtors = Object.keys(balances).filter(p => balances[p] < 0);

        while (creditors.length > 0 && debtors.length > 0) {
            const creditor = creditors[0];
            const debtor = debtors[0];

            const amount = Math.min(balances[creditor], -balances[debtor]);

            settlement.push(`${debtor} pays ${creditor} $${amount.toFixed(2)}`);

            balances[creditor] -= amount;
            balances[debtor] += amount;

            if (balances[creditor] === 0) creditors.shift();
            if (balances[debtor] === 0) debtors.shift();
        }

        return settlement;
    }

    function displaySettlement(settlement) {
        settlementList.innerHTML = '';
        settlement.forEach(s => {
            const li = document.createElement('li');
            li.textContent = s;
            settlementList.appendChild(li);
        });
    }

    addParticipantInput();
});
