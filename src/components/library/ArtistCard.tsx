import React, { useState, useEffect } from 'react';
import { LibraryCard } from './LibraryCard';
import { getOrFetchArtistImage } from '../../utils/artistImage';

interface ArtistCardProps {
    name: string;
    subtitle: string;
    fallbackCover?: string;
    onClick: () => void;
}

export const ArtistCard: React.FC<ArtistCardProps> = ({ name, subtitle, fallbackCover, onClick }) => {
    const [image, setImage] = useState<string | undefined>(fallbackCover);

    useEffect(() => {
        let active = true;
        const load = async () => {
             // Only fetch if we don't have a specific cover, or maybe we want to prioritize artist photo?
             // Memory says: "Artist images are fetched from the Wikipedia API ... prioritizing these images over album artwork"
             // So we should always try to fetch/get from DB.
             const wikiImage = await getOrFetchArtistImage(name);
             if (active && wikiImage) {
                 setImage(wikiImage);
             }
        };
        load();
        return () => { active = false; };
    }, [name]);

    return (
        <LibraryCard
            title={name}
            subtitle={subtitle}
            image={image || fallbackCover}
            fallbackIcon="group"
            onClick={onClick}
            // Make image round for artists
            // I'll add a style override or specific class if I could, but LibraryCard is generic.
            // For now, I'll stick to rounded square, or I can update LibraryCard to support 'variant' prop.
        />
    );
};
