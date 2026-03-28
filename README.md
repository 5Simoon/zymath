# Zymath Singularity v2 🌌

Zaawansowany matematyczny silnik edukacyjny zbudowany w czystym HTML, CSS i JavaScript. Projekt łączy interaktywną teorię, potężne narzędzia obliczeniowe oraz wyzwania algorytmiczne w jednym, w pełni zoptymalizowanym środowisku.

## 📖 O projekcie

Zymath Singularity powstał z myślą o uczniach, studentach oraz pasjonatach nauk ścisłych. Jego głównym celem jest przekształcenie suchej teorii w interaktywne doświadczenie. Dzięki połączeniu autorskich algorytmów z potęgą kalkulatorów graficznych aplikacja pozwala nie tylko rozwiązywać zadania, ale przede wszystkim – zrozumieć mechanizmy stojące za wynikami. 

Projekt został napisany w podejściu "Vanilla", bez ciężkich frameworków (jak React czy Angular), co gwarantuje błyskawiczne ładowanie i maksymalną wydajność w przeglądarce.

## 🚀 Główne funkcje

* **12 dedykowanych kalkulatorów:** Błyskawiczne rozwiązywanie problemów matematycznych (m.in. algebra, geometria, analiza).
* **Integracja z Desmos API:** Profesjonalny kalkulator graficzny wbudowany bezpośrednio w aplikację.
* **Baza 150 zadań:** Zestawy ćwiczeń podzielone na 3 poziomy trudności (łatwy, średni, zaawansowany), generowane dynamicznie.
* **Renderowanie LaTeX:** Perfekcyjny zapis wzorów matematycznych dzięki bibliotece MathJax.
* **Pancerna ochrona:** Zabezpieczenie przed botami przy użyciu **Cloudflare Turnstile** z walidacją po stronie serwera (Vercel Serverless Functions).

## 🛠️ Technologie

Projekt stawia na maksymalną wydajność i brak zbędnych zależności:
* **Frontend:** Vanilla HTML5, CSS3, JavaScript (ES6+)
* **Backend / Hosting:** Vercel (Serverless Edge Functions)
* **Bezpieczeństwo:** Cloudflare Turnstile, rygorystyczne nagłówki HTTP (CSP, HSTS)
* **Ikony & Typografia:** Lucide Icons, Google Fonts (Bricolage Grotesque, Figtree, Press Start 2P)

## 📂 Struktura projektu

Projekt został zoptymalizowany pod kątem bezpieczeństwa i szybkiego ładowania (oddzielenie logiki od struktury):

```text
/
├── index.html       # Główna struktura i tagi meta (Open Graph)
├── style.css        # Zoptymalizowany arkusz stylów
├── main.js          # Główna logika aplikacji
├── vercel.json      # Konfiguracja zabezpieczeń (CSP) dla Vercela
├── SECURITY.md      # Polityka bezpieczeństwa
└── api/
    └── config.js    # Bezserwerowy backend ukrywający klucze API
```
STRONA I KOD STWORZONY I OPRACOWANY PRZEZ 5SIMOON - WSZYSTKIE PRAWA ZASTRZEZONE / ALL RIGHTS RESERVED (C) - COPYRIGHT IS IN ORDER
