// Подключение к бэкенду (Supabase). Как заполнить — см. supabase/README.md.
// Этот ключ публичный: он позволяет сайту только оформить заказ и подписаться
// на рассылку. Читать заказы и подписчиков с ним нельзя.
// Если поля пустые, заказы и подписка на сайте не отправляются (покажется ошибка).
window.PERLA_BACKEND = {
  url: "https://xyslzdkhxfhqeyzaiqen.supabase.co",
  anonKey: "sb_publishable_hKBNPCoLBp-CH37Zm_3_vw_vZYF6TA8",  // публичный ключ (publishable)
};
