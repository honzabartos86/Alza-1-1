
# Alza Performance Feedback Tool

Tato aplikace slouží Store Managerům Alzy pro rychlou analýzu výkonu zaměstnanců a generování strukturované zpětné vazby pomocí AI (Gemini).

## Funkce
- Import dat z Excelu (list `User Performance`).
- Fulltextové vyhledávání v seznamu zaměstnanců.
- Vizualizace klíčových metrik (Produkty vs Služby).
- Hlasový záznam doplňujícího kontextu k hodnocení.
- Generování zpětné vazby dle metodiky **NVC (Nenásilná komunikace)** přes Gemini API.
- Export výsledného hodnocení do TXT a PDF.

## Požadavky pro spuštění
1. Pro správnou funkčnost API je vyžadován `API_KEY` v prostředí (v tomto frameworku je automaticky injektován).
2. Spusťte aplikaci přes lokální vývojový server (např. `npm start` nebo `live-server`).

## Jak používat
1. Nahrajte soubor `Finall report.xlsx`.
2. Ujistěte se, že soubor obsahuje list `User Performance` se správnými hlavičkami.
3. Vyhledejte a vyberte zaměstnance ze seznamu v levém panelu.
4. (Volitelně) Nahrajte krátký hlasový komentář k výkonu zaměstnance.
5. Klikněte na **Vytvořit záznam (AI)**.
6. Prohlédněte si výsledek a exportujte jej pomocí ikon v pravém horním robu.
