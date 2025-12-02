import React, { useState, useEffect } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { getTranslation } from "../translations";
import {
  updateCountdownTime,
  isCountdownActive,
} from "./CountdownGlobalEffects";
import "./Store.css";

const STORE_ITEMS_STORAGE_KEY = "portfolio_store_items";
const CLICK_MULTIPLIER_KEY = "portfolio_click_multiplier";
const STORE_PRICES_KEY = "portfolio_store_prices";
const UNLOCKED_APPS_KEY = "portfolio_unlocked_apps";
const MAX_QUANTITY_PER_ITEM = 5;

// Itens da loja - serão adicionados um por um
const storeItems = [
  {
    id: "item1",
    name: { en: "Power Amplifier (PA)", fr: "Amplificateur de Puissance (PA)" },
    description: {
      en: "Increases the value of each click by 2x",
      fr: "Augmente la valeur de chaque clic par 2x",
    },
    prices: [25, 50, 100, 200], // Preços fixos para cada upgrade (5 upgrades)
    effect: "multiplyClicks",
    value: 2,
  },
  {
    id: "factory",
    name: { en: "Factory", fr: "Usine" },
    description: {
      en: "Produces 1000 coins every 10 seconds",
      fr: "Produit 1000 pièces toutes les 10 secondes",
    },
    prices: [500, 2000, 5000, 10000], // Preço fixo de 500 para cada fábrica (até 5)
    effect: "factory",
    productionAmount: 1000,
    productionInterval: 10000, // 10 segundos em milissegundos
  },
  {
    id: "countdown_30s",
    name: { en: "Time Extension (30s)", fr: "Extension de Temps (30s)" },
    description: {
      en: "Adds 30 seconds to the self-destruct countdown",
      fr: "Ajoute 30 secondes au compte à rebours d'auto-destruction",
    },
    prices: [1000], // Preço fixo de 1000
    effect: "addCountdownTime",
    timeToAdd: 30, // Adiciona 30 segundos
  },
  {
    id: "countdown_1h",
    name: { en: "Time Extension (1h)", fr: "Extension de Temps (1h)" },
    description: {
      en: "Adds 1 hour to the self-destruct countdown",
      fr: "Ajoute 1 heure au compte à rebours d'auto-destruction",
    },
    prices: [50000], // Preço fixo de 50000
    effect: "addCountdownTime",
    timeToAdd: 3600, // Adiciona 1 hora (3600 segundos)
  },
  {
    id: "unlock_witness",
    name: { en: "The Witness", fr: "Le Témoin" },
    description: {
      en: "Unlocks The Witness application in Labs",
      fr: "Débloque l'application Le Témoin dans les Labs",
    },
    prices: [10000], // Preço fixo de 10000
    effect: "unlockApp",
    appId: "witness", // ID da aplicação a ser desbloqueada
  },
  // Outros itens serão adicionados depois
];

function Store({ clickerCount, setClickerCount, setClickMultiplier }) {
  const { language } = useLanguage();
  const t = getTranslation(language);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [ownedItems, setOwnedItems] = useState({});
  const [itemPrices, setItemPrices] = useState({});
  const [clickMultiplier, setClickMultiplierLocal] = useState(1);
  const [autoClickActive, setAutoClickActive] = useState(false);

  // Carrega dados do localStorage
  useEffect(() => {
    const savedItems = localStorage.getItem(STORE_ITEMS_STORAGE_KEY);
    const savedPrices = localStorage.getItem(STORE_PRICES_KEY);

    if (savedItems) {
      const items = JSON.parse(savedItems);
      setOwnedItems(items);

      // Carrega preços salvos ou inicializa com preços base
      if (savedPrices) {
        const prices = JSON.parse(savedPrices);
        setItemPrices(prices);
      } else {
        // Inicializa preços com o primeiro preço de cada item
        const initialPrices = {};
        storeItems.forEach((item) => {
          if (item.prices && item.prices.length > 0) {
            initialPrices[item.id] = item.prices[0];
          }
        });
        setItemPrices(initialPrices);
        localStorage.setItem(STORE_PRICES_KEY, JSON.stringify(initialPrices));
      }

      // Aplica efeitos dos itens
      let multiplier = 1;
      let autoClick = false;

      Object.keys(items).forEach((itemId) => {
        const item = storeItems.find((i) => i.id === itemId);
        const quantity = items[itemId] || 0;
        if (item && quantity > 0) {
          if (item.effect === "multiplyClicks") {
            // Cada item comprado adiciona apenas 1 ao multiplicador
            multiplier += quantity;
          } else if (item.effect === "autoClick" && quantity > 0) {
            autoClick = true;
          }
          // Fábricas são processadas em um useEffect separado
        }
      });

      setClickMultiplierLocal(multiplier);
      setAutoClickActive(autoClick);
      // Salva no localStorage para compartilhar com o clicker
      localStorage.setItem(CLICK_MULTIPLIER_KEY, multiplier.toString());
      if (setClickMultiplier) {
        setClickMultiplier(multiplier);
      }
    } else {
      // Se não tem itens, garante que o multiplicador é 1
      localStorage.setItem(CLICK_MULTIPLIER_KEY, "1");
      if (setClickMultiplier) {
        setClickMultiplier(1);
      }
      // Inicializa preços com o primeiro preço de cada item
      const initialPrices = {};
      storeItems.forEach((item) => {
        if (item.prices && item.prices.length > 0) {
          initialPrices[item.id] = item.prices[0];
        }
      });
      setItemPrices(initialPrices);
      localStorage.setItem(STORE_PRICES_KEY, JSON.stringify(initialPrices));
    }
  }, [setClickMultiplier]);

  // Auto clicker
  useEffect(() => {
    if (!autoClickActive) return;

    const interval = setInterval(() => {
      setClickerCount((prev) => prev + clickMultiplier);
    }, 2000);

    return () => clearInterval(interval);
  }, [autoClickActive, clickMultiplier]);

  // Fábricas - produzem moedas automaticamente
  useEffect(() => {
    const factoryItems = storeItems.filter((item) => item.effect === "factory");
    if (factoryItems.length === 0) return;

    let totalFactories = 0;
    factoryItems.forEach((factoryItem) => {
      const quantity = ownedItems[factoryItem.id] || 0;
      totalFactories += quantity;
    });

    if (totalFactories === 0) return;

    // Calcula a produção total de todas as fábricas
    let totalProduction = 0;
    factoryItems.forEach((factoryItem) => {
      const quantity = ownedItems[factoryItem.id] || 0;
      if (quantity > 0) {
        totalProduction += factoryItem.productionAmount * quantity;
      }
    });

    if (totalProduction === 0) return;

    const interval = setInterval(() => {
      setClickerCount((prev) => prev + totalProduction);
    }, 10000); // 10 segundos

    return () => clearInterval(interval);
  }, [ownedItems]);

  // Calcula o preço atual de um item baseado na quantidade possuída
  const getCurrentPrice = (item) => {
    const owned = ownedItems[item.id] || 0;

    // Se já atingiu o limite, retorna 0 (não pode comprar mais)
    if (owned >= MAX_QUANTITY_PER_ITEM) {
      return 0;
    }

    // Usa a lista de preços fixos
    if (item.prices && item.prices.length > owned) {
      return item.prices[owned];
    }

    // Fallback: se não tem preço salvo, usa o primeiro preço
    if (itemPrices[item.id]) {
      return itemPrices[item.id];
    }

    // Último fallback
    return item.prices && item.prices.length > 0 ? item.prices[0] : 50;
  };

  const handleBuy = (item) => {
    const currentPrice = getCurrentPrice(item);
    const owned = ownedItems[item.id] || 0;

    // Para itens de desbloqueio, verifica se já foi comprado
    if (item.effect === "unlockApp" && owned > 0) {
      return; // Já foi desbloqueado
    }

    // Verifica se já atingiu o limite máximo
    if (owned >= MAX_QUANTITY_PER_ITEM) {
      return;
    }

    if (clickerCount >= currentPrice) {
      const newCount = clickerCount - currentPrice;
      setClickerCount(newCount);

      const newOwnedItems = {
        ...ownedItems,
        [item.id]: owned + 1,
      };
      setOwnedItems(newOwnedItems);
      localStorage.setItem(
        STORE_ITEMS_STORAGE_KEY,
        JSON.stringify(newOwnedItems)
      );

      // Atualiza o preço para a próxima compra (se houver)
      const nextOwned = owned + 1;
      let nextPrice = 0;
      if (item.prices && item.prices.length > nextOwned) {
        nextPrice = item.prices[nextOwned];
      }

      const newPrices = {
        ...itemPrices,
        [item.id]: nextPrice,
      };
      setItemPrices(newPrices);
      localStorage.setItem(STORE_PRICES_KEY, JSON.stringify(newPrices));

      // Processa efeitos especiais
      if (item.effect === "addCountdownTime" && item.timeToAdd) {
        // Adiciona tempo ao countdown se estiver ativo
        if (isCountdownActive()) {
          const COUNTDOWN_TIME_KEY = "portfolio_countdown_time";
          const COUNTDOWN_MS_KEY = "portfolio_countdown_ms";
          const currentTime = parseInt(
            localStorage.getItem(COUNTDOWN_TIME_KEY) || "60",
            10
          );
          const currentMs = parseInt(
            localStorage.getItem(COUNTDOWN_MS_KEY) || "0",
            10
          );
          const newTime = currentTime + item.timeToAdd;
          updateCountdownTime(newTime, currentMs);
        }
      } else if (item.effect === "unlockApp" && item.appId) {
        // Desbloqueia uma aplicação
        const unlockedApps = JSON.parse(
          localStorage.getItem(UNLOCKED_APPS_KEY) || "[]"
        );
        if (!unlockedApps.includes(item.appId)) {
          unlockedApps.push(item.appId);
          localStorage.setItem(UNLOCKED_APPS_KEY, JSON.stringify(unlockedApps));
          // Dispara evento para atualizar a lista de aplicações
          window.dispatchEvent(new CustomEvent("apps-unlocked"));
        }
      }

      // Recalcula o multiplicador baseado em todos os itens
      let newMultiplier = 1;
      let newAutoClick = false;

      Object.keys(newOwnedItems).forEach((itemId) => {
        const storeItem = storeItems.find((i) => i.id === itemId);
        const quantity = newOwnedItems[itemId] || 0;
        if (storeItem && quantity > 0) {
          if (storeItem.effect === "multiplyClicks") {
            // Cada item comprado adiciona apenas 1 ao multiplicador
            newMultiplier += quantity;
          } else if (storeItem.effect === "autoClick" && quantity > 0) {
            newAutoClick = true;
          }
        }
      });

      setClickMultiplierLocal(newMultiplier);
      setAutoClickActive(newAutoClick);
      // Salva no localStorage para compartilhar com o clicker
      localStorage.setItem(CLICK_MULTIPLIER_KEY, newMultiplier.toString());
      if (setClickMultiplier) {
        setClickMultiplier(newMultiplier);
      }
    }
  };

  const getItemName = (item) => {
    return item.name[language] || item.name.en;
  };

  const getItemDescription = (item) => {
    return item.description[language] || item.description.en;
  };

  return (
    <div className="Store">
      <div className="Store-header">
        <h2 className="Store-title">
          {language === "fr" ? "Boutique" : "Store"}
        </h2>
        <div className="Store-currency">
          <span className="Store-currency-label">
            {language === "fr" ? "Pièces" : "Coins"}:
          </span>
          <span className="Store-currency-value">{clickerCount}</span>
        </div>
      </div>

      <div className="Store-items">
        <h3 className="Store-items-title">
          <span className="Store-items-title-icon">🌙</span>
          {language === "fr" ? "Améliorer les clics" : "Upgrade Clicks"}
        </h3>

        {/* Navegação entre itens */}
        {storeItems.length > 1 && (
          <div className="Store-navigation">
            <button
              className="Store-nav-button"
              onClick={() =>
                setCurrentItemIndex((prev) =>
                  prev === 0 ? storeItems.length - 1 : prev - 1
                )
              }
            >
              ‹
            </button>
            <span className="Store-nav-indicator">
              {currentItemIndex + 1} / {storeItems.length}
            </span>
            <button
              className="Store-nav-button"
              onClick={() =>
                setCurrentItemIndex((prev) =>
                  prev === storeItems.length - 1 ? 0 : prev + 1
                )
              }
            >
              ›
            </button>
          </div>
        )}

        {/* Item atual */}
        {storeItems[currentItemIndex] &&
          (() => {
            const item = storeItems[currentItemIndex];
            const owned = ownedItems[item.id] || 0;
            const currentPrice = getCurrentPrice(item);
            const canAfford = clickerCount >= currentPrice;
            // Para itens de desbloqueio, considera "out of stock" se já foi comprado
            const isOutOfStock =
              (item.effect === "unlockApp" && owned > 0) ||
              owned >= MAX_QUANTITY_PER_ITEM;

            return (
              <div className="Store-item-container">
                <div
                  className={`Store-item ${
                    !canAfford || isOutOfStock ? "Store-item--disabled" : ""
                  } ${isOutOfStock ? "Store-item--out-of-stock" : ""}`}
                >
                  <div className="Store-item-header">
                    <h4 className="Store-item-name">{getItemName(item)}</h4>
                    {owned > 0 && (
                      <span className="Store-item-owned">
                        {language === "fr"
                          ? `Possédé: x${owned}`
                          : `Owned: x${owned}`}
                      </span>
                    )}
                  </div>
                  <p className="Store-item-description">
                    {getItemDescription(item)}
                  </p>
                  <div className="Store-item-footer">
                    {isOutOfStock ? (
                      <span className="Store-item-out-of-stock">
                        {language === "fr"
                          ? "Rupture de stock"
                          : "Out of Stock"}
                      </span>
                    ) : (
                      <>
                        <span className="Store-item-price">
                          {currentPrice} 🪙
                        </span>
                        <button
                          className="Store-item-buy"
                          onClick={() => handleBuy(item)}
                          disabled={!canAfford}
                        >
                          {language === "fr" ? "Acheter" : "Buy"}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
      </div>
    </div>
  );
}

export default Store;
