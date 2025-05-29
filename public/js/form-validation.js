document.getElementById('consultation-form').addEventListener('submit', function (e) {
    const phone = this.phone.value;
    const email = this.email.value;
  
    const phoneRegex = /^\+?[0-9\s\-]{7,15}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
    if (!phoneRegex.test(phone)) {
      e.preventDefault();
      alert('Введите корректный номер телефона.');
    } else if (!emailRegex.test(email)) {
      e.preventDefault();
      alert('Введите корректный адрес электронной почты.');
    }
  });
  