// SPDX-License-Identifier: MIT

pragma solidity ^0.8.11;

library AtlantisLib {
    enum Orbit {
        COMMON, // 0
        UNCOMMON, // 1
        RARE, // 2
        EPIC // 3
    }

    enum OrbitName {
        HALO_RING, //0
        PANDORA, //1
        ATLAS, //2
        METIS, //3
        ENTWINED, //4
        RAINBOW_CLOUDS, //5
        GALATICA, //6
        ASTEROIDS, //7
        INTERSTELLAR_PINK, //8
        INTERSTELLAR_GRADIENT, //9
        // Epic planets
        INTERSTELLAR_GOLD //10
    }

    enum Background {
        PURPLE_HUES, //0
        BROWN_HUES, //1
        WAVY, //2
        SHOOTING_STARS, //3
        // Epic planets
        GOLD_HUES, //4
        GOLD_SHOOTING_STARS, //5
        WAVY_GOLD, //6
        GOLD_SKIES //7
    }

    enum Evolution {
        ALPHA, // 1-19
        BETA, // 20-29
        GAMMA, // 30-39
        DELTA, // 40-49
        EPSILON // 50
    }

    enum Element {
        FIRE, // 0
        LIGHTNING, // 1
        STEEL // 2
    }

    struct Planet {
        uint8 level; // Max Level: 50
        Element element;
        Orbit orbit;
        OrbitName orbitName;
        Background background;
        bool onExpedition;
    }

    enum Rarity {
        COMMON,
        UNCOMMON,
        RARE,
        EPIC
    }

    /**
     * @notice Returns planet element as string
     */
    function _planetElementToString(AtlantisLib.Element element) internal pure returns (string memory) {
        if (element == AtlantisLib.Element.FIRE) {
            return "Fire";
        } else if (element == AtlantisLib.Element.STEEL) {
            return "Steel";
        } else if (element == AtlantisLib.Element.LIGHTNING) {
            return "Lightning";
        } else {
            return "";
        }
    }

    /**
     * @notice Returns planet orbit as string
     */
    function _planetOrbitToString(AtlantisLib.Orbit orbit) internal pure returns (string memory) {
        if (orbit == AtlantisLib.Orbit.COMMON) {
            return "Common";
        } else if (orbit == AtlantisLib.Orbit.UNCOMMON) {
            return "Uncommon";
        } else if (orbit == AtlantisLib.Orbit.RARE) {
            return "Rare";
        } else if (orbit == AtlantisLib.Orbit.EPIC) {
            return "Epic";
        } else {
            return "";
        }
    }

    /**
     * @notice Get tier of equipment based on level
     * @param level Level of an equipment
     */
    function _getEquipmentTier(uint8 level) internal pure returns (AtlantisLib.Rarity tier) {
        if (level < 1) {
            tier = AtlantisLib.Rarity.COMMON;
        } else if (level >= 1 && level < 5) {
            tier = AtlantisLib.Rarity.UNCOMMON;
        } else if (level >= 5 && level < 8) {
            tier = AtlantisLib.Rarity.RARE;
        } else if (level >= 8 && level <= 10) {
            tier = AtlantisLib.Rarity.EPIC;
        }
    }

    /**
     * @notice Returns planet orbit as string
     */
    function _planetOrbitTypeToString(AtlantisLib.OrbitName orbitName) internal pure returns (string memory) {
        if (orbitName == AtlantisLib.OrbitName.HALO_RING) {
            return "Halo Ring";
        } else if (orbitName == AtlantisLib.OrbitName.PANDORA) {
            return "Pandora";
        } else if (orbitName == AtlantisLib.OrbitName.ATLAS) {
            return "Atlas";
        } else if (orbitName == AtlantisLib.OrbitName.METIS) {
            return "Metis";
        } else if (orbitName == AtlantisLib.OrbitName.ENTWINED) {
            return "Entwined";
        } else if (orbitName == AtlantisLib.OrbitName.RAINBOW_CLOUDS) {
            return "Rainbow Clouds";
        } else if (orbitName == AtlantisLib.OrbitName.GALATICA) {
            return "Galatica";
        } else if (orbitName == AtlantisLib.OrbitName.ASTEROIDS) {
            return "Asteroids";
        } else if (orbitName == AtlantisLib.OrbitName.INTERSTELLAR_PINK) {
            return "Interstellar Pink";
        } else if (orbitName == AtlantisLib.OrbitName.INTERSTELLAR_GRADIENT) {
            return "Interstellar Gradient";
            // Epic planets
        } else if (orbitName == AtlantisLib.OrbitName.INTERSTELLAR_GOLD) {
            return "Interstellar Gold";
        } else {
            return "";
        }
    }

    /**
     * @notice Returns planet orbit as string
     */
    function _planetBackgroundToString(AtlantisLib.Background background) internal pure returns (string memory) {
        if (background == AtlantisLib.Background.PURPLE_HUES) {
            return "Purple Hues";
        } else if (background == AtlantisLib.Background.BROWN_HUES) {
            return "Brown Hues";
        } else if (background == AtlantisLib.Background.WAVY) {
            return "Wavy";
        } else if (background == AtlantisLib.Background.SHOOTING_STARS) {
            return "Shooting Stars";
            // Epic planets
        } else if (background == AtlantisLib.Background.WAVY_GOLD) {
            return "Wavy Gold";
        } else if (background == AtlantisLib.Background.GOLD_SHOOTING_STARS) {
            return "Gold Shooting Stars";
        } else if (background == AtlantisLib.Background.GOLD_HUES) {
            return "Gold Hues";
        } else if (background == AtlantisLib.Background.GOLD_SKIES) {
            return "Gold Skies";
        } else {
            return "";
        }
    }
}
