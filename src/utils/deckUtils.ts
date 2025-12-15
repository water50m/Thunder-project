// src/utils/deckUtils.ts

/**
 * ฟังก์ชันสำหรับสุ่มจัดเรียง Array (Fisher-Yates Shuffle)
 * @param array Array ของ string (Card IDs)
 * @returns Array ที่ถูกสุ่มจัดเรียงแล้ว
 */
export const shuffleArray = (array: string[]): string[] => {
    let currentIndex = array.length, randomIndex;
    const arrayCopy = [...array]; 

    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        [arrayCopy[currentIndex], arrayCopy[randomIndex]] = [
            arrayCopy[randomIndex], arrayCopy[currentIndex]];
    }

    return arrayCopy;
};