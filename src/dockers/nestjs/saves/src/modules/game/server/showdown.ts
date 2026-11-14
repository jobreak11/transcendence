/*
Hand ranking
- Royal flush
- Straight flush (1)
- Four of a kind (2)
- Full house (3)
- Flush (4)
- Straight (5)
- Three of a kind (6)
- Two pair (7)
- One pair (8)
- High card (9)

- Check best 5 cards for each player from 7 cards (2 player cards + 5 pool cards)
- each rank has unique score
- check score step (take all 7 cards and check for best 5 cards)
    1. check if flush
    2. check if straight
    3. if (flush && straight)
        return straight flush calculate score (1) 8M+
       else if (flush)
        return flush calculate score (2) 5M
       else if (straight)
        return straight calculate score (3) 4M
    4. check for 4 of a kind
       if (4 of a kind)
        return 4 of a kind calculate score (4)
    5. check for 3 of a kind
        if (3 of a kind)
            cut 3 of them from the 7 cards
    6. check for pairs
        if (3 of a kind && 1 pair)
            return full house calculate score (5)
        else if (3 of a kind)
            return 3 of a kind calculate score (6)
        else if (2 pairs)
            return 2 pairs calculate score (7)
        else if (1 pair)
            return 1 pair calculate score (8)
        else
            return high card calculate score (9)
*/