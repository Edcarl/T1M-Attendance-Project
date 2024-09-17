document.getElementById('fileInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function(event) {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

        const tableBody = document.querySelector('#outputTable tbody');
        const summaryBody = document.querySelector('#summaryTable tbody');
        tableBody.innerHTML = '';
        summaryBody.innerHTML = '';

        const employeeData = {};

        rows.forEach((row, index) => {
            if (index > 0) {
                const employeeId = row[0];
                const excelDate = row[1];
                const jsDate = getJsDateFromExcel(excelDate);
                const dateString = jsDate.toLocaleDateString('en-GB'); // Format as dd/mm/yyyy

                if (!employeeData[employeeId]) {
                    employeeData[employeeId] = {};
                }

                if (!employeeData[employeeId][dateString]) {
                    employeeData[employeeId][dateString] = [];
                }

                employeeData[employeeId][dateString].push(jsDate);
            }
        });

        for (const employeeId in employeeData) {
            for (const date in employeeData[employeeId]) {
                const timestamps = employeeData[employeeId][date];
                timestamps.sort((a, b) => a - b); // Sort timestamps

                const timeIn = timestamps[0];
                const timeOut = timestamps[timestamps.length - 1];

                let totalHours;
                let status;
                if (timestamps.length === 1) {
                    totalHours = "Didn't clock out";
                    status = "Didn't clock out";
                } else {
                    totalHours = ((timeOut - timeIn) / (1000 * 60 * 60)).toFixed(2); // Calculate total hours
                    if (totalHours < 7.5 && totalHours > 0 ) {
                        let deficit = Math.round(8 - totalHours);
                        status = "Under time: " + deficit + " hour/s";
                    } else if (totalHours > 8.5) {
                        let OT = Math.round(totalHours - 8);
                        status = "Over time: " + OT + " hour/s";
                    } else if (totalHours <= 0) {
                        status = "Didn't clock out";
                    } else {
                        status = "Regular time";
                    }
                }


                const tr = document.createElement('tr');
                const employeeIdCell = document.createElement('td');
                const dateCell = document.createElement('td');
                const timeInCell = document.createElement('td');
                const timeOutCell = document.createElement('td');
                const totalHoursCell = document.createElement('td');

                employeeIdCell.textContent = employeeId;
                dateCell.textContent = date;
                timeInCell.textContent = timeIn.toLocaleTimeString('en-US', { hour12: true });
                timeOutCell.textContent = timestamps.length > 1 ? timeOut.toLocaleTimeString('en-US', { hour12: true }) : 'N/A';
                totalHoursCell.textContent = totalHours;

                tr.appendChild(employeeIdCell);
                tr.appendChild(dateCell);
                tr.appendChild(timeInCell);
                tr.appendChild(timeOutCell);
                tr.appendChild(totalHoursCell);
                tableBody.appendChild(tr);

                const summaryTr = document.createElement('tr');
                const summaryEmployeeIdCell = document.createElement('td');
                const summaryDateCell = document.createElement('td');
                const statusCell = document.createElement('td');

                summaryEmployeeIdCell.textContent = employeeId;
                summaryDateCell.textContent = date;
                statusCell.textContent = status;

                summaryTr.appendChild(summaryEmployeeIdCell);
                summaryTr.appendChild(summaryDateCell);
                summaryTr.appendChild(statusCell);
                summaryBody.appendChild(summaryTr);
            }
        }
    };

    reader.readAsArrayBuffer(file);
});

document.getElementById('searchButton').addEventListener('click', function() {
    const employeeId = document.getElementById('searchEmployeeId').value.toLowerCase();
    const date = document.getElementById('searchDate').value;
    const employeeTableBody = document.querySelector('#employeeTable tbody');
    employeeTableBody.innerHTML = '';

    const table = document.getElementById('outputTable');
    const rows = table.getElementsByTagName('tr');

    for (let i = 1; i < rows.length; i++) {
        const cells = rows[i].getElementsByTagName('td');
        const rowEmployeeId = cells[0].textContent.toLowerCase();
        const rowDate = cells[1].textContent;

        if ((employeeId === '' || rowEmployeeId.includes(employeeId)) &&
            (date === '' || rowDate === new Date(date).toLocaleDateString('en-GB'))) {
            const tr = document.createElement('tr');
            for (let j = 0; j < cells.length; j++) {
                const td = document.createElement('td');
                td.textContent = cells[j].textContent;
                tr.appendChild(td);
            }
            employeeTableBody.appendChild(tr);
        }
    }
});

document.getElementById('clearButton').addEventListener('click', function() {
    const employeeTableBody = document.getElementById('employeeTable').getElementsByTagName('tbody')[0];
    employeeTableBody.innerHTML = '';
});

document.getElementById('toggleArrow').addEventListener('click', function() {
    var container = document.getElementById('floatingContainer');
    if (container.classList.contains('expanded')) {
        container.classList.remove('expanded');
        this.classList.remove('expanded');
    } else {
        container.classList.add('expanded');
        this.classList.add('expanded');
    }
});

// Function to convert Excel date to JavaScript date
function getJsDateFromExcel(excelDate) {
    const excelEpoch = new Date(1899, 11, 30); // Excel epoch starts on December 30, 1899
    const msPerDay = 86400000; // Number of milliseconds in a day
    const jsDate = new Date(excelEpoch.getTime() + excelDate * msPerDay);
    return jsDate;
}
