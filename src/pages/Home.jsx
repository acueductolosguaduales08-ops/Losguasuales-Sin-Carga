import { useState } from 'react';
import Header from '../components/layout/Header';
import Hero from '../components/home/Hero';
import QueryCards from '../components/home/QueryCards';
import GallerySection from '../components/home/GallerySection';
import GalleryModal from '../components/home/GalleryModal';
import PublicacionesSection from '../components/home/PublicacionesSection';
import PostModal from '../components/home/PostModal';
import VideosSection from '../components/home/VideosSection';
import VideoPlayerModal from '../components/home/VideoPlayerModal';
import VideoEditorModal from '../components/home/VideoEditorModal';
import SurveyFloat from '../components/home/SurveyFloat';
import EditFab from '../components/home/EditFab';
import WelcomeFooter from '../components/home/WelcomeFooter';
import RevealSection from '../components/common/RevealSection';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const [galleryState, setGalleryState] = useState({ item: null, items: [], index: 0 });
  const [postItem, setPostItem] = useState(null);
  const [videoActivo, setVideoActivo] = useState(null);
  const [videoEditorOpen, setVideoEditorOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { puedeEditar } = useAuth();

  const openGalleryItem = (item, items = [], index = 0) => setGalleryState({ item, items, index });
  const navigateGallery = (item, index) => setGalleryState((prev) => ({ ...prev, item, index }));
  const closeGallery = () => setGalleryState({ item: null, items: [], index: 0 });

  return (
    <div className="relative bg-gray-50 text-gray-800 dark:bg-gray-950 dark:text-gray-100 min-h-screen font-sans antialiased pb-24 transition-colors">
      <Header />

      <SurveyFloat />

      <main className="w-full max-w-6xl mx-auto pt-16 md:pt-20 pb-10 px-4 md:px-6">
        <div className="space-y-6">
          <RevealSection delay={1}>
            <Hero />
          </RevealSection>
          <RevealSection delay={2}>
            <QueryCards />
          </RevealSection>
          <RevealSection delay={3}>
            <GallerySection key={`gallery-${refreshKey}`} onOpenItem={openGalleryItem} />
          </RevealSection>
          <RevealSection delay={4}>
            <VideosSection
              key={`videos-${refreshKey}`}
              onOpenVideo={setVideoActivo}
              onNuevoVideo={() => setVideoEditorOpen(true)}
            />
          </RevealSection>
          <RevealSection delay={5}>
            <PublicacionesSection key={`posts-${refreshKey}`} onOpenItem={setPostItem} />
          </RevealSection>
        </div>

        <RevealSection delay={5}>
          <WelcomeFooter />
        </RevealSection>
      </main>

      {puedeEditar && <EditFab onContentChanged={() => setRefreshKey((k) => k + 1)} />}

      <GalleryModal
        item={galleryState.item}
        items={galleryState.items}
        index={galleryState.index}
        onNavigate={navigateGallery}
        onClose={closeGallery}
      />
      <PostModal post={postItem} onClose={() => setPostItem(null)} />
      <VideoPlayerModal video={videoActivo} onClose={() => setVideoActivo(null)} />
      <VideoEditorModal
        open={videoEditorOpen}
        onClose={() => setVideoEditorOpen(false)}
        onSaved={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  );
}
