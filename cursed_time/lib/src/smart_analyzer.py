#!/usr/bin/env python3
"""
Smart Analyzer Discard for Balatro
Using the Balatro library structure
"""

import asyncio
import logging
import sys
from pathlib import Path
from typing import List, Tuple
from itertools import combinations

# Add the parent directory to path to import the balatro library
sys.path.insert(0, str(Path(__file__).parent.parent / "lib" / "src"))

# Import from our balatro library
from balatro import Balatro, Screen, ScreenType
from balatro.menu import Menu, Deck, Stake
from balatro.play import Play, PlayResult, DiscardResult, HandCard
from balatro.deck import Card, Rank, Suit
from balatro.blinds import SelectBlind
from balatro.shop import Shop
from balatro.overview import RoundOverview, GameOverview
from balatro.net import Connection

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('smart_analyzer')

# ===== Constants =====
DISCARD_THRESHOLD_RANK = 8  # Discard 2-9, keep 10,J,Q,K,A
HOST = "127.0.0.1"
PORT = 34143

# ===== Helper Functions =====

def rank_to_value(rank: Rank) -> int:
    """Convert rank to numeric value for comparison"""
    rank_map = {
        Rank.Two: 0, Rank.Three: 1, Rank.Four: 2, Rank.Five: 3,
        Rank.Six: 4, Rank.Seven: 5, Rank.Eight: 6, Rank.Nine: 7,
        Rank.Ten: 8, Rank.Jack: 9, Rank.Queen: 10, Rank.King: 11,
        Rank.Ace: 12
    }
    return rank_map[rank]

# ===== Hand Evaluation =====

def evaluate_hand(cards: List[Card]) -> Tuple[int, str]:
    """Evaluate a 5-card poker hand and return (score, hand_name)"""
    if len(cards) != 5:
        return 0, "Invalid"
    
    # Check for flush
    flush = all(card.suit == cards[0].suit for card in cards)
    
    # Check for straight
    sorted_ranks = sorted([rank_to_value(card.rank) for card in cards])
    straight = len(cards) == 5
    
    # Special case: A-2-3-4-5
    if sorted_ranks != [0, 1, 2, 3, 12]:
        for i in range(len(sorted_ranks) - 1):
            if sorted_ranks[i] + 1 != sorted_ranks[i + 1]:
                straight = False
                break
    
    # Count ranks
    rank_counts = {}
    for card in cards:
        if card.rank not in rank_counts:
            rank_counts[card.rank] = []
        rank_counts[card.rank].append(card)
    
    # Sort by count (descending)
    counts = sorted(rank_counts.items(), key=lambda x: len(x[1]), reverse=True)
    
    # Add dummy entries to avoid index errors
    while len(counts) < 2:
        counts.append((Rank.Two, []))
    
    primary_hand = counts[0][1]
    secondary_hand = counts[1][1]
    
    # Determine hand type and score
    chips = 0
    mult = 0
    hand_name = ""
    scoring_cards = []
    
    if flush and len(primary_hand) == 5:
        chips, mult, hand_name = 160, 16, "Flush Five"
        scoring_cards = cards
    elif flush and len(primary_hand) == 3 and len(secondary_hand) == 2:
        chips, mult, hand_name = 140, 14, "Flush House"
        scoring_cards = cards
    elif len(primary_hand) == 5:
        chips, mult, hand_name = 120, 12, "Five of a Kind"
        scoring_cards = cards
    elif straight and flush:
        chips, mult, hand_name = 100, 8, "Straight Flush"
        scoring_cards = cards
    elif len(primary_hand) == 4:
        chips, mult, hand_name = 60, 7, "Four of a Kind"
        scoring_cards = primary_hand
    elif len(primary_hand) == 3 and len(secondary_hand) == 2:
        chips, mult, hand_name = 40, 4, "Full House"
        scoring_cards = cards
    elif flush:
        chips, mult, hand_name = 35, 4, "Flush"
        scoring_cards = cards
    elif straight:
        chips, mult, hand_name = 30, 4, "Straight"
        scoring_cards = cards
    elif len(primary_hand) == 3:
        chips, mult, hand_name = 30, 3, "Three of a Kind"
        scoring_cards = primary_hand
    elif len(primary_hand) == 2 and len(secondary_hand) == 2:
        chips, mult, hand_name = 20, 2, "Two Pair"
        scoring_cards = primary_hand + secondary_hand
    elif len(primary_hand) == 2:
        chips, mult, hand_name = 10, 2, "One Pair"
        scoring_cards = primary_hand
    else:
        chips, mult, hand_name = 5, 1, "High Card"
        highest = max(cards, key=lambda c: rank_to_value(c.rank))
        scoring_cards = [highest]
    
    # Add chip values from scoring cards
    for card in scoring_cards:
        chips += card.chip_value()
    
    total_score = chips * mult
    return total_score, hand_name

def find_best_combination(hand: List[HandCard]) -> Tuple[int, List[int], str]:
    """Find the best 5-card combination from hand, returns (score, indices, hand_name)"""
    hand_size = len(hand)
    
    # If we have 5 or fewer cards, return all
    if hand_size <= 5:
        indices = list(range(hand_size))
        if hand_size == 5:
            cards = [hc.card for hc in hand if hc.card]
            score, hand_name = evaluate_hand(cards)
            return score, indices, hand_name
        return 0, indices, "Incomplete"
    
    best_score = 0
    best_indices = [0, 1, 2, 3, 4]
    best_hand_name = "None"
    
    # Generate all C(n,5) combinations
    for combo in combinations(range(hand_size), 5):
        cards = []
        valid = True
        for idx in combo:
            if hand[idx].card:
                cards.append(hand[idx].card)
            else:
                valid = False
                break
        
        if valid and len(cards) == 5:
            score, hand_name = evaluate_hand(cards)
            if score > best_score:
                best_score = score
                best_indices = list(combo)
                best_hand_name = hand_name
    
    return best_score, best_indices, best_hand_name

def find_all_combinations_ranked(hand: List[HandCard]) -> List[Tuple[int, List[int], str]]:
    """Find all 5-card combinations from hand, returns list of (score, indices, hand_name) sorted by score"""
    hand_size = len(hand)
    
    if hand_size < 5:
        return []
    
    all_combinations = []
    
    # Generate all C(n,5) combinations
    for combo in combinations(range(hand_size), 5):
        cards = []
        valid = True
        for idx in combo:
            if hand[idx].card:
                cards.append(hand[idx].card)
            else:
                valid = False
                break
        
        if valid and len(cards) == 5:
            score, hand_name = evaluate_hand(cards)
            all_combinations.append((score, list(combo), hand_name))
    
    # Sort by score descending
    all_combinations.sort(key=lambda x: x[0], reverse=True)
    return all_combinations

def get_discard_indices(hand: List[HandCard], threshold: int) -> List[int]:
    """Determine which cards to discard based on rank threshold"""
    discard_indices = []
    
    for i, hand_card in enumerate(hand):
        if hand_card.card and rank_to_value(hand_card.card.rank) < threshold:
            discard_indices.append(i)
    
    # Limit to 5 discards
    if len(discard_indices) > 5:
        # Sort by rank and take the 5 lowest
        ranked_indices = [(i, rank_to_value(hand[i].card.rank)) for i in discard_indices]
        ranked_indices.sort(key=lambda x: x[1])
        discard_indices = [x[0] for x in ranked_indices[:5]]
    
    return discard_indices

# ===== Main Smart Analyzer =====

class SmartAnalyzer:
    """Smart Analyzer that implements the game strategy"""
    
    def __init__(self):
        self.logger = logger
    
    async def run(self, host: str = HOST, port: int = PORT):
        """Run the smart analyzer server"""
        server = await asyncio.start_server(
            self.handle_connection, host, port
        )
        
        addr = server.sockets[0].getsockname()
        self.logger.info(f'Smart Analyzer Discard hosted on {addr[0]}:{addr[1]} - waiting for Balatro...')
        
        async with server:
            await server.serve_forever()
    
    async def handle_connection(self, reader, writer):
        """Handle a single Balatro connection"""
        connection = Connection(reader, writer)
        addr = writer.get_extra_info('peername')
        self.logger.info(f"✓ Connected to Balatro from {addr}")
        
        try:
            # Create Balatro instance with this connection
            balatro = Balatro(connection)
            
            # Run the game loop
            await self.game_loop(balatro)
            
        except Exception as e:
            self.logger.error(f"Game error: {e}")
            import traceback
            traceback.print_exc()
        finally:
            writer.close()
            await writer.wait_closed()
            self.logger.info("Connection lost, waiting for new connection...")
    
    async def game_loop(self, balatro: Balatro):
        """Main game loop using Balatro instance"""
        self.logger.info("Starting game loop")
        while True:
            try:
                # Get current screen
                self.logger.debug("Requesting current screen...")
                screen = await balatro.screen()
                self.logger.info(f"Got screen type: {screen.type}")
                
                # Handle based on screen type
                if screen.type == ScreenType.MENU:
                    await self.handle_menu(screen.menu)
                
                elif screen.type == ScreenType.SELECT_BLIND:
                    await self.handle_select_blind(screen.select_blind)
                
                elif screen.type == ScreenType.PLAY:
                    await self.handle_play(screen.play)
                
                elif screen.type == ScreenType.SHOP:
                    await self.handle_shop(screen.shop)
                elif screen.type == ScreenType.GAME_OVER:
                    await self.handle_game_over(screen.game_over)

                # Small delay between actions
                await asyncio.sleep(0.1)
                
            except ConnectionError:
                self.logger.info("Connection closed by Balatro")
                break
            except Exception as e:
                self.logger.error(f"Unexpected error in game loop: {e}")
                import traceback
                traceback.print_exc()
                break
    
    async def handle_menu(self, menu: Menu):
        """Handle main menu"""
        self.logger.info("▶ At Main Menu ◀")
        self.logger.info("🎮 Starting new run automatically...")
        
        # Auto-start with Red deck and White stake
        select_blind = await menu.new_run(Deck.Red, Stake.White)
        self.logger.info("Started new run with Red deck and White stake")
    
    async def handle_select_blind(self, select_blind: SelectBlind):
        """Handle blind selection"""
        self.logger.info("▶ At Select Blind screen ◀")
        self.logger.info(f"Small blind: {select_blind.small()}")
        self.logger.info(f"Big blind: {select_blind.big()}")
        self.logger.info(f"Boss blind: {select_blind.boss()}")
        
        # Wait a bit for the UI to be ready
        await asyncio.sleep(0.5)
        
        # Always select the current blind (never skip)
        try:
            play = await select_blind.select()
            self.logger.info("Selected blind")
        except Exception as e:
            # If selection fails, wait and try again
            self.logger.warning(f"Blind selection failed: {e}, retrying...")
            await asyncio.sleep(1.0)
            # The game loop will handle getting the screen again
    async def handle_game_over(self, game_over):
        """Handle game over screen"""
        self.logger.info("▶ At Game Over screen ◀")
        self.logger.info("🎮 Starting new run...")
    
        # Wait a bit for the UI to be ready
        await asyncio.sleep(1.0)
    
        # Try to start a new run
        try:
                # This might be a method like new_run() on the game_over object
                select_blind = await game_over.new_run(Deck.Red, Stake.White)
                self.logger.info("Started new run from game over screen")
        except Exception as e:
                self.logger.error(f"Failed to start new run from game over: {e}")
        # Alternative: try to go to main menu fir
        try:
            menu = await game_over.main_menu()
            self.logger.info("Returned to main menu")
        except Exception as e2:
            self.logger.error(f"Failed to return to main menu: {e2}") 
    async def handle_play(self, play: Play):
        """Handle play screen with smart card selection"""
        self.logger.info("\n▶ At Play screen ◀")
        
        # Display game state
        hand = play.hand()
        self.logger.info(f"Current hand size: {len(hand)}")
        self.logger.info(f"Hands left: {play.hands()}")
        self.logger.info(f"Discards left: {play.discards()}")
        self.logger.info(f"Current score: {play.score()}")
        self.logger.info(f"Money: ${play.money()}")
        
        # Get blind target
        blind_info = play.blind()
        blind_target = self.get_blind_target(blind_info)
        self.logger.info(f"Blind target: {blind_target}")
        
        # Print current hand
        self.logger.info("Current hand:")
        for i, hc in enumerate(hand):
            if hc.card:
                self.logger.info(f"  [{i}] {hc.card.rank.value} of {hc.card.suit.value}")
        
        # Smart discard decision
        if play.discards() > 0 and play.hands() > 0:
            await self.handle_smart_discard(play, blind_target)
        else:
            # No discards left or no hands left, must play
            await self.handle_play_phase(play)
    
    def get_blind_target(self, blind_info: dict) -> float:
        """Extract blind target score from blind info"""
        if "Small" in blind_info:
            return blind_info["Small"]["chips"]
        elif "Big" in blind_info:
            return blind_info["Big"]["chips"]
        elif "Boss" in blind_info:
            return blind_info["Boss"]["chips"]
        return 300  # Default fallback
    
    async def handle_smart_discard(self, play: Play, blind_target: float):
        """Smart discard based on required score per hand and hand type analysis"""
        hand = play.hand()
        current_score = play.score()
        hands_left = play.hands()
        
        # Calculate required average score per hand
        points_needed = blind_target - current_score
        if points_needed <= 0:
            self.logger.info("Already reached blind target, playing best hand")
            await self.handle_play_phase(play)
            return
        
        avg_score_needed = points_needed / hands_left if hands_left > 0 else points_needed
        self.logger.info(f"Points needed: {points_needed}, Avg per hand needed: {avg_score_needed:.1f}")
        
        # Get all combinations ranked by score
        all_combos = find_all_combinations_ranked(hand)
        
        if not all_combos:
            self.logger.info("Not enough cards for valid hand")
            return
        
        # Get best hand info
        best_score, best_indices, best_hand_name = all_combos[0]
        self.logger.info(f"Best possible hand: {best_hand_name} - {best_score} points")
        
        # Decision: Can our best hand meet the requirement?
        if best_score >= avg_score_needed:
            # We can meet the target, just play
            self.logger.info("Best hand meets requirement, playing without discard")
            await self.handle_play_phase(play)
        else:
            # We need to improve our hand - analyze top hands for common cards
            self.logger.info("Best hand insufficient, analyzing top hands for strategic discard")
            
            # Look at top 3 hands (or fewer if not enough combinations)
            top_hands = all_combos[:min(3, len(all_combos))]
            
            # Log the top hands
            for i, (score, indices, hand_name) in enumerate(top_hands):
                cards_str = ", ".join([f"{hand[idx].card.rank.value}{hand[idx].card.suit.value[0]}" for idx in indices if hand[idx].card])
                self.logger.info(f"  Top {i+1}: {hand_name} ({score} pts) - {cards_str}")
            
            # Check if top hands are same type
            hand_types = [h[2] for h in top_hands]
            if len(set(hand_types)) == 1:
                # All same type - find common cards
                self.logger.info(f"All top hands are '{hand_types[0]}' - keeping common cards")
                
                # Find intersection of card indices
                common_indices = set(top_hands[0][1])
                for _, indices, _ in top_hands[1:]:
                    common_indices &= set(indices)
                
                if common_indices:
                    self.logger.info(f"Common cards across top {hand_types[0]} hands: {sorted(list(common_indices))}")
                    keep_indices = common_indices
                else:
                    # No common cards, keep best hand
                    self.logger.info("No common cards, keeping best hand")
                    keep_indices = set(best_indices)
            else:
                # Different hand types - use more complex logic
                self.logger.info("Top hands are different types - analyzing card importance")
                
                # Count how often each card appears in top hands
                card_importance = {}
                for score, indices, hand_name in top_hands:
                    # Weight by score to favor cards in better hands
                    weight = score / best_score
                    for idx in indices:
                        card_importance[idx] = card_importance.get(idx, 0) + weight
                
                # Keep cards that appear in multiple top hands or have high importance
                keep_indices = set()
                for idx, importance in card_importance.items():
                    if importance >= 1.5:  # Appears in 2+ hands or strongly in 1
                        keep_indices.add(idx)
                
                # Ensure we keep at least 3 cards (to have something to build on)
                if len(keep_indices) < 3:
                    keep_indices = set(best_indices)
            
            # Find cards to discard (all except keep_indices)
            all_indices = set(range(len(hand)))
            discard_candidates = list(all_indices - keep_indices)
            
            if discard_candidates:
                # Limit to 5 discards
                discard_indices = discard_candidates[:5]
                
                self.logger.info(f"Keeping {len(keep_indices)} strategic cards, discarding {len(discard_indices)}:")
                for idx in discard_indices:
                    if hand[idx].card:
                        card = hand[idx].card
                        self.logger.info(f"  Discarding [{idx}]: {card.rank.value} of {card.suit.value}")
                
                # Click cards to discard
                play = await play.click(discard_indices)
                
                # Execute discard
                result = await play.discard()
                
                if result.type == DiscardResult.AGAIN:
                    self.logger.info("Discard successful!")
                elif result.type == DiscardResult.GAME_OVER:
                    self.logger.info("Game Over during discard!")
            else:
                # All cards are important, play best hand
                self.logger.info("All cards are strategically important, playing without discard")
                await self.handle_play_phase(play)
    
    async def handle_discard_phase(self, play: Play):
        """Legacy discard handler - now redirects to smart discard"""
        # This is kept for compatibility but now uses smart logic
        blind_info = play.blind()
        blind_target = self.get_blind_target(blind_info)
        await self.handle_smart_discard(play, blind_target)
    
    async def handle_play_phase(self, play: Play):
        """Handle the play phase - select and play best 5 cards"""
        hand = play.hand()
        self.logger.info(f"\nCurrent hand: {len(hand)} cards")
        
        # Find best combination with hand name
        best_score, best_indices, best_hand_name = find_best_combination(hand)
        
        # Calculate number of combinations
        num_combinations = 1
        if len(hand) > 5:
            n = len(hand)
            num_combinations = (n * (n-1) * (n-2) * (n-3) * (n-4)) // (5 * 4 * 3 * 2 * 1)
        
        self.logger.info(f"Evaluated all {num_combinations} possible 5-card combinations")
        self.logger.info(f"Best combination: {best_hand_name} - {best_score} points")
        self.logger.info("Selected cards:")
        for idx in best_indices:
            if idx < len(hand) and hand[idx].card:
                card = hand[idx].card
                self.logger.info(f"  [{idx}] {card.rank.value} of {card.suit.value}")
        
        # Select best cards
        play = await play.click(best_indices)
        
        # Play the hand
        result = await play.play()
        
        if result.type == PlayResult.AGAIN:
            self.logger.info("Must play again")
            # The game loop will handle the next screen
        elif result.type == PlayResult.ROUND_OVER:
            await self.handle_round_over(result.overview)
        elif result.type == PlayResult.GAME_OVER:
            self.logger.info("Game Over!")
    
    async def handle_round_over(self, overview: RoundOverview):
        """Handle round over screen"""
        self.logger.info("\n🎉 Round complete!")
        self.logger.info(f"Total earned: ${overview.total_earned()}")
        self.logger.info(f"Earnings breakdown: {overview.earnings()}")
        
        # Wait a bit then cash out
        await asyncio.sleep(2)
        shop = await overview.cash_out()
        self.logger.info("Cashed out to shop")
    
    async def handle_shop(self, shop: Shop):
        """Handle shop screen"""
        self.logger.info("\n▶ At Shop screen ◀")
        self.logger.info(f"Shop items: {shop.main_cards()}")
        self.logger.info(f"Vouchers: {shop.vouchers()}")
        self.logger.info(f"Boosters: {shop.boosters()}")
        
        # For now, just leave without buying
        await asyncio.sleep(1)
        select_blind = await shop.leave()
        self.logger.info("Left shop")

# ===== Entry Point =====

def main():
    """Entry point"""
    # Enable debug logging for connection
    logging.getLogger('balatro.connection').setLevel(logging.DEBUG)
    
    logger.info("Smart Analyzer Discard - Python Version")
    logger.info(f"Using discard threshold: {DISCARD_THRESHOLD_RANK}")
    logger.info("This will discard cards 2-9 and keep 10,J,Q,K,A")
    
    analyzer = SmartAnalyzer()
    
    try:
        asyncio.run(analyzer.run())
    except KeyboardInterrupt:
        logger.info("\nShutting down...")

if __name__ == "__main__":
    main()

