import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Coins, Clock, ShoppingBag, Gift, Plus, Trash2 } from 'lucide-react';
import { ITEMS, ITEM_TYPES, RARITY } from '../data/items';
import Sprite from './common/Sprite';
import { playCoinSound, playHealSound } from '../utils/sound';

const Shop = ({ currentUser }) => {
    const { state, dispatch, actions } = useGame();
    const { character, rewards } = state;
    const [activeTab, setActiveTab] = useState('items'); // items | rewards | community
    const [marketItems, setMarketItems] = useState([]);
    const [isLoadingMarket, setIsLoadingMarket] = useState(false);

    // New Reward Form
    const [rewardName, setRewardName] = useState('');
    const [rewardCost, setRewardCost] = useState('');
    const [isAddingReward, setIsAddingReward] = useState(false);

    const buyItem = (item) => {
        if (character.gold >= item.cost) {
            playCoinSound();
            dispatch({ type: 'BUY_ITEM', payload: item });
        }
    };

    const buyReward = (reward) => {
        if (character.timePoints >= reward.cost) {
            playHealSound();
            dispatch({ type: 'SPEND_TIME', payload: reward.cost });
        }
    };

    const handleAddReward = (e) => {
        e.preventDefault();
        if (rewardName && rewardCost) {
            actions.addReward(rewardName, rewardCost);
            setRewardName('');
            setRewardCost('');
            setIsAddingReward(false);
        }
    };

    // Fetch Community Market Items
    const fetchMarketItems = async () => {
        setIsLoadingMarket(true);
        try {
            const res = await fetch('api/market.php?action=list');
            const data = await res.json();
            if (data.items) {
                setMarketItems(data.items);
            }
        } catch (e) {
            console.error("Failed to fetch market items", e);
        } finally {
            setIsLoadingMarket(false);
        }
    };

    React.useEffect(() => {
        if (activeTab === 'community') {
            fetchMarketItems();
        }
    }, [activeTab]);

    const buyMarketItem = async (listing) => {
        if (character.gold < listing.price) {
            alert("Not enough gold!");
            return;
        }

        if (confirm(`Buy ${listing.item_data.name} from ${listing.seller_name} for ${listing.price} Gold?`)) {
            try {
                const res = await fetch('api/market.php?action=buy', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ listing_id: listing.id })
                });
                const data = await res.json();

                if (data.success && data.item) {
                    playCoinSound();
                    dispatch({ type: 'BUY_ITEM_CUSTOM_PRICE', payload: { item: data.item, price: listing.price } });
                    // Remove from local list
                    setMarketItems(prev => prev.filter(i => i.id !== listing.id));
                } else {
                    alert(data.error || "Failed to buy item.");
                }
            } catch (e) {
                console.error("Failed to execute buy transaction", e);
            }
        }
    };

    // Weekly Rotation Logic
    const getWeeklyShopItems = () => {
        const now = new Date();
        const oneJan = new Date(now.getFullYear(), 0, 1);
        const weekNum = Math.ceil((((now - oneJan) / 86400000) + oneJan.getDay() + 1) / 7);
        const year = now.getFullYear();

        // Seed: unique per week
        let seed = year * 100 + weekNum;

        // Simple Seeded Random
        const random = () => {
            const x = Math.sin(seed++) * 10000;
            return x - Math.floor(x);
        };

        return ITEMS.filter((item, index) => {
            if (item.type === ITEM_TYPES.CONSUMABLE || item.type === ITEM_TYPES.PET_FOOD) return true; // Always available

            // For gear, random selection
            const r = random();

            // Chances based on rarity
            let chance = 0.6; // Default/Common
            if (item.rarity === RARITY.RARE) chance = 0.3;
            else if (item.rarity === RARITY.EPIC) chance = 0.1;

            return r <= chance;
        });
    };

    const weeklyItems = getWeeklyShopItems();

    if (!character) {
        return <div className="p-8 text-center text-gray-400">Loading Shop...</div>;
    }

    return (
        <div className="bg-[#1a102e]/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-4 sm:p-6 h-full flex flex-col relative min-h-[500px]">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#130f1e] px-4 sm:px-6 py-1 text-xs sm:text-sm text-rpg-gold font-heading font-bold tracking-widest border border-rpg-gold/30 shadow-[0_0_15px_rgba(255,215,0,0.3)] rounded-full whitespace-nowrap">
                HUMBLE MERCHANT
            </div>

            {/* Header/Tabs */}
            <div className="flex justify-center items-center mb-6 mt-6 sm:mt-4 pb-2">
                <div className="flex flex-wrap sm:flex-nowrap justify-center gap-2 p-1 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md w-full sm:w-auto">
                    <button
                        onClick={() => setActiveTab('items')}
                        className={`
                            flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-bold text-xs transition-all duration-300 flex-1 sm:flex-none
                            ${activeTab === 'items'
                                ? 'bg-rpg-gold text-rpg-bg shadow-[0_0_10px_rgba(255,215,0,0.4)]'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'}
                        `}
                    >
                        <ShoppingBag size={16} /> WARES
                    </button>
                    <button
                        onClick={() => setActiveTab('community')}
                        className={`
                            flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-bold text-xs transition-all duration-300 flex-1 sm:flex-none
                            ${activeTab === 'community'
                                ? 'bg-indigo-600 text-white shadow-[0_0_10px_rgba(79,70,229,0.5)]'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'}
                        `}
                    >
                        COMMUNITY
                    </button>
                    <button
                        onClick={() => setActiveTab('rewards')}
                        className={`
                            flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-bold text-xs transition-all duration-300 flex-1 sm:flex-none w-full sm:w-auto
                            ${activeTab === 'rewards'
                                ? 'bg-rpg-gold text-rpg-bg shadow-[0_0_10px_rgba(255,215,0,0.4)]'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'}
                        `}
                    >
                        <Gift size={16} /> BOUNTIES
                    </button>
                </div>
            </div>

            <div className="space-y-3 overflow-y-auto flex-grow pr-2 custom-scrollbar">
                {activeTab === 'items' ? (
                    weeklyItems.length === 0 ? (
                        <div className="text-gray-500 text-center mt-10 font-heading italic">"Nothing but dust here..."</div>
                    ) : (
                        weeklyItems.map(item => (
                            <div key={item.id} className="bg-black/30 border border-white/5 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4 group hover:bg-white/5 transition-all hover:border-rpg-gold/30 shadow-lg">
                                <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4">
                                    <div className="bg-black/40 p-3 rounded-2xl border border-white/10 shadow-inner group-hover:shadow-[0_0_15px_rgba(255,215,0,0.2)] transition-all">
                                        <Sprite
                                            src={item.sprite.src}
                                            x={item.sprite.x}
                                            y={item.sprite.y}
                                            width={item.sprite.width}
                                            height={item.sprite.height}
                                            scale={1.5}
                                        />
                                    </div>
                                    <div>
                                        <h3 className="text-sm text-rpg-gold font-bold font-heading uppercase tracking-wide group-hover:text-yellow-300 transition-colors flex items-center gap-2">
                                            {item.name}
                                            {character.inventory && character.inventory.filter(i => i.id === item.id).length > 0 && (
                                                <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-gray-300 tracking-wider font-sans">
                                                    Owned: {character.inventory.filter(i => i.id === item.id).length}
                                                </span>
                                            )}
                                        </h3>
                                        <p className="text-gray-400 text-xs font-sans mt-0.5">{item.description}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => buyItem(item)}
                                    disabled={character.gold < item.cost}
                                    className={`
                                        px-4 py-2 font-bold flex items-center gap-2 text-xs rounded-xl transition-all duration-300
                                        ${character.gold >= item.cost
                                            ? 'bg-white/10 text-rpg-gold hover:bg-rpg-gold hover:text-rpg-bg shadow-lg hover:shadow-[0_0_15px_rgba(255,215,0,0.5)]'
                                            : 'bg-white/5 text-gray-600 cursor-not-allowed'}
                                    `}
                                >
                                    <Coins size={14} /> {item.cost}
                                </button>
                            </div>
                        ))
                    )
                ) : activeTab === 'community' ? (
                    <div className="space-y-3">
                        <div className="text-center mb-4">
                            <p className="text-xs text-indigo-300 uppercase font-bold tracking-widest border border-indigo-500/30 bg-indigo-500/10 inline-block px-4 py-1.5 rounded-full">Items Listed by Other Adventurers</p>
                            <button onClick={fetchMarketItems} className="ml-3 text-xs text-gray-400 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors border border-white/5">Refresh</button>
                        </div>

                        {isLoadingMarket ? (
                            <div className="text-center py-8 text-gray-500 font-heading animate-pulse">Checking global listings...</div>
                        ) : marketItems.length === 0 ? (
                            <div className="text-gray-500 text-center mt-10 font-heading italic">"Market is completely empty today."</div>
                        ) : (
                            marketItems.map(listing => {
                                const isOwnListing = currentUser && currentUser.id == listing.seller_id;
                                return (
                                    <div key={listing.id} className="bg-black/30 border border-indigo-500/10 hover:border-indigo-500/30 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4 group hover:bg-indigo-500/5 transition-all shadow-lg">
                                        <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4">
                                            <div className="bg-black/40 p-3 rounded-2xl border border-white/10 shadow-inner group-hover:shadow-[0_0_15px_rgba(79,70,229,0.2)] transition-all relative">
                                                {/* Rarity Border could go here if we inspect item_data.rarity */}
                                                <Sprite
                                                    src={listing.item_data.sprite.src}
                                                    x={listing.item_data.sprite.x}
                                                    y={listing.item_data.sprite.y}
                                                    width={listing.item_data.sprite.width}
                                                    height={listing.item_data.sprite.height}
                                                    scale={1.5}
                                                />
                                            </div>
                                            <div>
                                                <h3 className="text-sm text-indigo-400 font-bold font-heading uppercase tracking-wide group-hover:text-indigo-300 transition-colors flex items-center gap-2">
                                                    {listing.item_data.name}
                                                </h3>
                                                <p className="text-gray-500 text-[10px] font-bold uppercase mt-0.5 tracking-wider">Seller: <span className="text-gray-300">{listing.seller_name}</span></p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => buyMarketItem(listing)}
                                            disabled={character.gold < listing.price || isOwnListing}
                                            className={`
                                            px-4 py-2 font-bold flex flex-col items-center justify-center gap-0.5 text-xs rounded-xl transition-all duration-300 min-w-[80px]
                                            ${isOwnListing
                                                    ? 'bg-white/5 text-gray-600 cursor-not-allowed border border-white/5'
                                                    : character.gold >= listing.price
                                                        ? 'bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white border border-indigo-500/30 hover:shadow-[0_0_15px_rgba(79,70,229,0.5)]'
                                                        : 'bg-white/5 text-gray-600 cursor-not-allowed border border-white/5'}
                                        `}
                                        >
                                            <span className="flex items-center gap-1"><Coins size={12} /> {listing.price}</span>
                                            {isOwnListing && <span className="text-[9px] uppercase tracking-wider text-gray-500">Your Item</span>}
                                        </button>
                                    </div>
                                )
                            })
                        )}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {/* Add Reward Button / Form */}
                        {isAddingReward ? (
                            <form onSubmit={handleAddReward} className="glass-card p-4 mb-4 border border-rpg-gold/30 animate-in fade-in zoom-in-95 duration-200">
                                <h4 className="text-xs font-bold text-rpg-gold uppercase tracking-wider mb-3">New Bounty</h4>
                                <div className="flex flex-col sm:flex-row gap-3 mb-3">
                                    <input
                                        type="text"
                                        placeholder="Reward Title..."
                                        value={rewardName}
                                        onChange={e => setRewardName(e.target.value)}
                                        className="flex-grow bg-black/40 border border-white/10 rounded-lg p-2.5 text-white text-sm outline-none focus:border-rpg-gold focus:ring-1 focus:ring-rpg-gold/50 transition-all font-sans placeholder:text-gray-600"
                                        autoFocus
                                    />
                                    <input
                                        type="number"
                                        placeholder="Cost"
                                        value={rewardCost}
                                        onChange={e => setRewardCost(e.target.value)}
                                        className="w-24 bg-black/40 border border-white/10 rounded-lg p-2.5 text-white text-sm outline-none focus:border-rpg-gold focus:ring-1 focus:ring-rpg-gold/50 transition-all font-sans placeholder:text-gray-600"
                                    />
                                </div>
                                <div className="flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsAddingReward(false)}
                                        className="text-xs text-red-400 hover:text-red-300 font-bold px-3 py-1.5 transition-colors uppercase tracking-wider"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="text-xs bg-rpg-green text-white px-4 py-2 font-bold rounded-lg shadow-[0_0_10px_rgba(45,204,112,0.3)] hover:bg-green-500 hover:shadow-[0_0_15px_rgba(45,204,112,0.5)] transition-all uppercase tracking-wide"
                                    >
                                        Save Bounty
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <button
                                onClick={() => setIsAddingReward(true)}
                                className="w-full py-3 border border-dashed border-white/20 rounded-xl text-gray-400 hover:border-rpg-gold hover:text-rpg-gold hover:bg-rpg-gold/5 transition-all flex justify-center items-center gap-2 text-xs font-bold font-heading uppercase tracking-widest"
                            >
                                <Plus size={16} /> Create Custom Bounty
                            </button>
                        )}

                        {/* List */}
                        {rewards && rewards.map(reward => (
                            <div key={reward.id} className="bg-black/30 border border-white/5 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4 group hover:border-white/20 hover:bg-white/5 transition-all shadow-lg">
                                <div className="text-center sm:text-left">
                                    <h3 className="text-sm text-gray-200 font-bold font-heading uppercase tracking-wide group-hover:text-white transition-colors">{reward.name}</h3>
                                    <p className="text-gray-500 text-xs mt-0.5">Cost: {reward.cost} min</p>
                                </div>
                                <div className="flex gap-2 items-center">
                                    <button
                                        onClick={() => buyReward(reward)}
                                        disabled={character.timePoints < reward.cost}
                                        className={`
                                            px-3 py-1.5 font-bold flex items-center gap-1.5 text-xs rounded-lg transition-all duration-300
                                            ${character.timePoints >= reward.cost
                                                ? 'bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white border border-blue-500/30'
                                                : 'bg-white/5 text-gray-600 cursor-not-allowed'}
                                        `}
                                    >
                                        <Clock size={14} /> {reward.cost}
                                    </button>
                                    <button
                                        onClick={() => actions.deleteReward(reward.id)}
                                        className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                                        title="Delete Reward"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
export default Shop;
