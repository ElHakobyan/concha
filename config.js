// Подключение к бэкенду (Supabase). Как заполнить — см. supabase/README.md.
// Этот ключ публичный: он позволяет сайту только оформить заказ и подписаться
// на рассылку. Читать заказы и подписчиков с ним нельзя.
// Пока поля пустые, заказы и подписка на сайте не отправляются (покажется ошибка).
window.CONCHA_BACKEND = {
  url: "",      // например "https://abcdefghijkl.supabase.co"
  anonKey: "",  // Project Settings → API Keys → publishable (или anon) key
};
