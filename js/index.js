document.addEventListener("DOMContentLoaded", function() {
    const monthYear = document.getElementById('monthYear');
    const calendarDates = document.getElementById('calendarDates');
    const prevMonth = document.getElementById('prevMonth');
    const nextMonth = document.getElementById('nextMonth');

    // สร้างข้อความแจ้งเตือนสถานะการโหลดข้อมูล
    const container = document.querySelector('.calendar-container');
    const loaderStatus = document.createElement("div");
    loaderStatus.style.textAlign = "center";
    loaderStatus.style.fontSize = "0.9rem";
    loaderStatus.style.color = "var(--secondary-color)";
    loaderStatus.style.marginBottom = "10px";
    container.insertBefore(loaderStatus, document.querySelector('.calendar-header'));

    let currentDate = new Date();
    let bookingData = [];

    // ฟังก์ชันดึงข้อมูลการจองจาก Google Sheets
    function fetchBookings() {
        if (!CONFIG.GAS_URL || CONFIG.GAS_URL.includes("YOUR_SCRIPT_ID")) return;
        
        loaderStatus.textContent = "กำลังโหลดข้อมูลปฏิทินการจอง...";
        
        fetch(CONFIG.GAS_URL)
            .then(response => response.json())
            .then(data => {
                bookingData = data;
                loaderStatus.textContent = ""; // ซ่อนข้อความเมื่อโหลดเสร็จ
                renderCalendar(); // วาดปฏิทินใหม่เพื่อใส่ข้อมูล
            })
            .catch(error => {
                console.error('Error fetching bookings:', error);
                loaderStatus.textContent = "ไม่สามารถเชื่อมต่อข้อมูลการจองได้";
            });
    }

    function renderCalendar() {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const firstDay = new Date(year, month, 1).getDay();
        const lastDate = new Date(year, month + 1, 0).getDate();

        const thaiMonths = [
            "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", 
            "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
        ];
        
        monthYear.textContent = `${thaiMonths[month]} ${year + 543}`;
        calendarDates.innerHTML = "";

        for (let i = 0; i < firstDay; i++) {
            const emptyDiv = document.createElement("div");
            emptyDiv.classList.add("empty");
            calendarDates.appendChild(emptyDiv);
        }

        const today = new Date();
        for (let i = 1; i <= lastDate; i++) {
            const dateDiv = document.createElement("div");
            
            // สร้างตัวเลขวันที่
            const dateSpan = document.createElement("span");
            dateSpan.classList.add("date-number");
            dateSpan.textContent = i;
            dateDiv.appendChild(dateSpan);
            
            if (i === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                dateDiv.classList.add("today");
            }
            
            // ค้นหาข้อมูลการจองที่ตรงกับวันที่ในลูป
            const loopDateStr = year + "-" + String(month + 1).padStart(2, '0') + "-" + String(i).padStart(2, '0');
            const dayEvents = bookingData.filter(b => b.eventDate === loopDateStr);
            
            // นำข้อมูลการจองมาใส่ในช่องวันที่
            dayEvents.forEach(event => {
                const eventDiv = document.createElement("div");
                eventDiv.classList.add("event-indicator");
                
                // ย่อชื่อตึกให้สั้นลงเพื่อให้พอดีกับปฏิทิน
                let shortBuilding = event.building;
                if(shortBuilding.includes("ศูนย์การเรียนรู้")) shortBuilding = "MLC";
                if(shortBuilding.includes("สิริวิทยา")) shortBuilding = "สิริวิทยา";
                if(shortBuilding.includes("มหิดลสิทธาคาร")) shortBuilding = "สิทธาคาร";
                
                eventDiv.textContent = `${shortBuilding}: ${event.room}`;
                // ใช้ title เพื่อแสดงรายละเอียดเต็มๆ เวลาเอาเมาส์ไปชี้ (Hover)
                eventDiv.title = `งาน: ${event.eventName}\nอาคาร: ${event.building}\nห้อง: ${event.room}\nเวลา: ${event.startTime} - ${event.endTime}`;
                
                dateDiv.appendChild(eventDiv);
            });
            
            calendarDates.appendChild(dateDiv);
        }
    }

    prevMonth.addEventListener("click", () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });

    nextMonth.addEventListener("click", () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });

    renderCalendar();
    fetchBookings(); // สั่งให้ดึงข้อมูลจาก Sheet ทันทีที่เปิดหน้าเว็บ


    // =========================================================================
    // โค้ดส่วนที่เพิ่มใหม่ (ฟังก์ชันเปิด/ปิดปฏิทิน และสร้าง PDF)
    // =========================================================================

    // 1. ฟังก์ชัน เปิด/ปิด ปฏิทิน
    const btnToggleCalendar = document.getElementById("btnToggleCalendar");
    const calendarSection = document.getElementById("calendarSection");
    
    if (btnToggleCalendar && calendarSection) {
        btnToggleCalendar.addEventListener("click", function() {
            if (calendarSection.style.display === "none" || calendarSection.style.display === "") {
                calendarSection.style.display = "block"; 
                btnToggleCalendar.innerHTML = "📅 <span>ซ่อนปฏิทินการจอง</span>";
                btnToggleCalendar.style.backgroundColor = "#6c757d"; 
            } else {
                calendarSection.style.display = "none";
                btnToggleCalendar.innerHTML = "📅 <span>ดูปฏิทินการจอง</span>";
                btnToggleCalendar.style.backgroundColor = "#007bff"; 
            }
        });
    }

    // 2. ฟังก์ชันสร้างเอกสารราชการ (PDF)
    const btnPrintByDate = document.getElementById("btnPrintByDate");
    if (btnPrintByDate) {
        btnPrintByDate.addEventListener("click", function() {
            const selectedDate = document.getElementById("printDate").value;
            if (!selectedDate) {
                if (typeof Swal !== 'undefined') {
                    Swal.fire('แจ้งเตือน', 'กรุณาเลือกวันที่ก่อนทำการพิมพ์', 'warning');
                } else {
                    alert('กรุณาเลือกวันที่ก่อนทำการพิมพ์');
                }
                return;
            }

            const filteredData = bookingData.filter(b => b.eventDate === selectedDate);
            
            if (filteredData.length === 0) {
                if (typeof Swal !== 'undefined') {
                    Swal.fire('ไม่พบข้อมูล', 'ไม่มีการจองในวันที่คุณเลือก', 'info');
                } else {
                    alert('ไม่มีการจองในวันที่คุณเลือก');
                }
                return;
            }

            const printWindow = window.open('', '_blank');
            let htmlContent = `
                <!DOCTYPE html>
                <html lang="th">
                <head>
                    <meta charset="UTF-8">
                    <title>พิมพ์บันทึกข้อความ</title>
                    <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap" rel="stylesheet">
                    <style>
                        body { font-family: 'Sarabun', sans-serif; color: #000; font-size: 16pt; line-height: 1.6; margin: 0; }
                        .page { page-break-after: always; padding: 40px; box-sizing: border-box; }
                        .page:last-child { page-break-after: auto; }
                        .header { text-align: center; font-size: 24pt; font-weight: bold; margin-bottom: 30px; }
                        .memo-row { display: table; width: 100%; margin-bottom: 10px; }
                        .memo-label { font-weight: bold; display: table-cell; width: 120px; vertical-align: bottom; }
                        .memo-val { display: table-cell; border-bottom: 1px dotted #000; padding-left: 10px; vertical-align: bottom; }
                        .content { margin-top: 20px; text-indent: 50px; text-align: justify; }
                        .signature-box { margin-top: 80px; text-align: center; width: 300px; float: right; }
                        @media print { 
                            body { margin: 0; padding: 0; }
                            .page { padding: 0; margin: 20mm; }
                        }
                    </style>
                </head>
                <body>
            `;

            filteredData.forEach(row => {
                const remarksText = row.remarks ? ` (หมายเหตุ: ${row.remarks})` : "";
                const timestampText = row.timestamp ? row.timestamp.split(',')[0] : "-";
                
                htmlContent += `
                    <div class="page">
                        <div class="header">บันทึกข้อความ</div>
                        
                        <div class="memo-row">
                            <div class="memo-label">ส่วนงาน</div>
                            <div class="memo-val">${row.requester || '-'} (ประเภทผู้ใช้งาน: ${row.userType || '-'})</div>
                        </div>
                        <div class="memo-row">
                            <div class="memo-label">วันที่ยื่นขอ</div>
                            <div class="memo-val">${timestampText}</div>
                        </div>
                        <div class="memo-row">
                            <div class="memo-label">เรื่อง</div>
                            <div class="memo-val">ขออนุญาตใช้สถานที่ ${row.building}</div>
                        </div>
                        
                        <hr style="margin: 30px 0; border: 0.5px solid #000;" />
                        
                        <div style="margin-bottom: 20px;"><b>เรียน</b> ผู้อำนวยการ / ผู้ดูแลสถานที่ ${row.building}</div>
                        
                        <div class="content">
                            ด้วยหน่วยงาน/ข้าพเจ้า <b>${row.requester || '-'}</b> มีความประสงค์จะขออนุญาตใช้สถานที่ <b>${row.room || '-'}</b> ณ ${row.building || '-'} 
                            เพื่อจัดงานหรือกิจกรรม <b>"${row.eventName || '-'}"</b> โดยคาดว่าจะมีผู้เข้าร่วมจำนวน <b>${row.pax || '-'}</b> คน
                        </div>
                        <div class="content">
                            ในการนี้ จึงขออนุญาตใช้สถานที่ดังกล่าวในวันที่ <b>${row.eventDate || '-'}</b> 
                            ตั้งแต่เวลา <b>${row.startTime || '-'} น.</b> ถึงเวลา <b>${row.endTime || '-'} น.</b>${remarksText}
                        </div>
                        <div class="content">
                            จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติให้ความอนุเคราะห์ใช้สถานที่ดังกล่าวด้วย จะเป็นพระคุณยิ่ง
                        </div>
                        
                        <div class="signature-box">
                            <p>(ลงชื่อ).......................................................</p>
                            <p>(${row.requester || '.....................................'})</p>
                            <p>ผู้ขออนุญาตใช้สถานที่</p>
                        </div>
                        <div style="clear: both;"></div>
                    </div>
                `;
            });

            htmlContent += `
                <script>
                    window.onload = function() { 
                        setTimeout(() => { window.print(); }, 500);
                    }
                </script>
                </body>
                </html>
            `;

            printWindow.document.write(htmlContent);
            printWindow.document.close();
        });
    }
});