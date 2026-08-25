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
});