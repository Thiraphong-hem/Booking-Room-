document.addEventListener("DOMContentLoaded", function() {
    const roomSelect = document.getElementById("room");
    // รายชื่อห้องของอาคารสิริวิทยา (เพิ่มลดได้ตามต้องการ)
    const rooms = ["ห้อง 217", "ห้อง 322", "ห้อง 323", "ห้อง 411", "Minitheater", "ลานกันภัย"];
    
    if (roomSelect) {
        rooms.forEach(room => {
            let option = document.createElement("option");
            option.value = room;
            option.textContent = room;
            roomSelect.appendChild(option);
        });
    }

    const form = document.getElementById("bookingForm");
    if (form) {
        form.addEventListener("submit", function(e) {
            e.preventDefault();
            
            const loader = document.getElementById("loader");
            const submitBtn = form.querySelector('button[type="submit"]');
            
            if (!CONFIG.GAS_URL || CONFIG.GAS_URL.includes("YOUR_SCRIPT_ID")) {
                Swal.fire('ข้อผิดพลาด', 'กรุณาตั้งค่า GAS_URL ในไฟล์ js/config.js ก่อนใช้งาน', 'error');
                return;
            }

            loader.style.display = "block";
            submitBtn.disabled = true;

            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            fetch(CONFIG.GAS_URL, {
                method: "POST",
                mode: "no-cors",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            })
            .then(() => {
                loader.style.display = "none";
                submitBtn.disabled = false;
                Swal.fire('สำเร็จ', 'ส่งคำขอจองสถานที่เรียบร้อยแล้ว', 'success').then(() => {
                    form.reset();
                });
            })
            .catch(error => {
                loader.style.display = "none";
                submitBtn.disabled = false;
                Swal.fire('ข้อผิดพลาด', 'ไม่สามารถส่งข้อมูลได้ กรุณาลองใหม่อีกครั้ง', 'error');
                console.error("Error:", error);
            });
        });
    }
});