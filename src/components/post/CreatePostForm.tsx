'use client';

import { useState, useRef, ChangeEvent } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { 
  XMarkIcon, 
  PhotoIcon, 
  MapPinIcon, 
  FaceSmileIcon,
  TagIcon,
  ChevronLeftIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

interface ImagePreview {
  id: string;
  file: File;
  url: string;
}

interface FilterOption {
  name: string;
  class: string;
}

const filters: FilterOption[] = [
  { name: 'Normal', class: '' },
  { name: 'Clarendon', class: 'brightness-125 contrast-110 saturate-130' },
  { name: 'Gingham', class: 'brightness-105 sepia-10 contrast-90' },
  { name: 'Moon', class: 'grayscale-100 brightness-110' },
  { name: 'Lark', class: 'brightness-110 contrast-95 saturate-125' },
  { name: 'Reyes', class: 'brightness-85 contrast-90 saturate-75 sepia-25' },
  { name: 'Juno', class: 'brightness-105 contrast-115 saturate-150' },
  { name: 'Slumber', class: 'brightness-90 saturate-85 sepia-30' },
];

export default function CreatePostForm() {
  const router = useRouter();
  const { userId } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState<'upload' | 'filter' | 'details'>('upload');
  const [selectedFilter, setSelectedFilter] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const newFiles = Array.from(e.target.files);
    
    // Check file sizes and types
    const invalidFiles = newFiles.filter(file => {
      const isValidType = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.type);
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB limit
      return !isValidType || !isValidSize;
    });
    
    if (invalidFiles.length > 0) {
      setError('Please select valid image files (JPEG, PNG) under 5MB.');
      return;
    }
    
    const newImagePreviews: ImagePreview[] = newFiles.map(file => ({
      id: Math.random().toString(36).substring(2),
      file,
      url: URL.createObjectURL(file)
    }));
    
    setImages([...images, ...newImagePreviews]);
    setError(null);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (id: string) => {
    const updatedImages = images.filter(image => image.id !== id);
    setImages(updatedImages);
    
    if (updatedImages.length === 0) {
      setCurrentStep('upload');
    }
  };

  const handleSubmit = async () => {
    if (!userId || images.length === 0) return;
    
    try {
      setIsSubmitting(true);
      
      // In a real app, upload images to storage and create post in database
      // This is a mock implementation
      console.log('Creating post with:', {
        userId,
        images: images.length,
        caption,
        location,
        filter: selectedFilter
      });
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Success - redirect to home page
      router.push('/');
      
    } catch (error) {
      console.error('Error creating post:', error);
      setError('Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToNextStep = () => {
    if (currentStep === 'upload' && images.length > 0) {
      setCurrentStep('filter');
    } else if (currentStep === 'filter') {
      setCurrentStep('details');
    }
  };

  const goToPreviousStep = () => {
    if (currentStep === 'filter') {
      setCurrentStep('upload');
    } else if (currentStep === 'details') {
      setCurrentStep('filter');
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="max-w-2xl mx-auto md:ml-20 lg:ml-64 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-800">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
          {currentStep !== 'upload' && (
            <button 
              onClick={goToPreviousStep}
              className="text-gray-600 dark:text-gray-400"
            >
              <ChevronLeftIcon className="h-6 w-6" />
            </button>
          )}
          
          <h1 className="text-xl font-semibold flex-1 text-center">
            {currentStep === 'upload' ? 'Create New Post' : 
             currentStep === 'filter' ? 'Apply Filter' : 'Share Post'}
          </h1>
          
          {(currentStep === 'upload' && images.length > 0) || currentStep === 'filter' ? (
            <button 
              onClick={goToNextStep}
              className="text-blue-500 font-semibold"
            >
              Next
            </button>
          ) : currentStep === 'details' ? (
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`text-blue-500 font-semibold ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Share
            </button>
          ) : (
            <div className="w-16"></div> {/* Empty placeholder for alignment */}
          )}
        </div>

        {/* Content based on current step */}
        <div className="p-6">
          {currentStep === 'upload' && (
            <div className="flex flex-col items-center justify-center">
              {images.length === 0 ? (
                <div className="text-center">
                  <div className="mb-4">
                    <PhotoIcon className="h-20 w-20 mx-auto text-gray-300 dark:text-gray-700" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Drag photos and videos here</h3>
                  <button 
                    onClick={triggerFileInput}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                  >
                    Select from computer
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="w-full">
                  <div className="mb-4 relative">
                    <Swiper
                      modules={[Pagination, Navigation]}
                      pagination={{ clickable: true }}
                      navigation
                      className="aspect-square rounded-lg overflow-hidden"
                    >
                      {images.map((image) => (
                        <SwiperSlide key={image.id}>
                          <div className="relative w-full h-full">
                            <Image
                              src={image.url}
                              alt="Preview"
                              fill
                              className="object-cover"
                            />
                            <button
                              onClick={() => removeImage(image.id)}
                              className="absolute top-2 right-2 p-1 bg-black bg-opacity-60 rounded-full text-white"
                            >
                              <XMarkIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </SwiperSlide>
                      ))}
                    </Swiper>
                  </div>
                  <button
                    onClick={triggerFileInput}
                    className="w-full py-2 border border-gray-300 dark:border-gray-700 rounded-md text-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Add more photos
                  </button>
                </div>
              )}
              
              {error && (
                <div className="text-red-500 mt-4 text-center">{error}</div>
              )}
            </div>
          )}

          {currentStep === 'filter' && images.length > 0 && (
            <div>
              <div className="mb-6">
                <Swiper
                  modules={[Pagination, Navigation]}
                  pagination={{ clickable: true }}
                  navigation
                  className="aspect-square rounded-lg overflow-hidden"
                >
                  {images.map((image) => (
                    <SwiperSlide key={image.id}>
                      <div className="relative w-full h-full">
                        <Image
                          src={image.url}
                          alt="Preview"
                          fill
                          className={`object-cover ${selectedFilter}`}
                        />
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>
              
              <div className="grid grid-cols-4 gap-4">
                {filters.map((filter) => (
                  <button
                    key={filter.name}
                    onClick={() => setSelectedFilter(filter.class)}
                    className={`flex flex-col items-center ${selectedFilter === filter.class ? 'ring-2 ring-blue-500 rounded-lg' : ''}`}
                  >
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden mb-1">
                      <Image
                        src={images[0].url}
                        alt={filter.name}
                        fill
                        className={`object-cover ${filter.class}`}
                      />
                    </div>
                    <span className="text-xs">{filter.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentStep === 'details' && images.length > 0 && (
            <div className="flex flex-col md:flex-row">
              <div className="md:w-1/2 mb-4 md:mb-0 md:pr-4">
                <Swiper
                  modules={[Pagination, Navigation]}
                  pagination={{ clickable: true }}
                  navigation
                  className="aspect-square rounded-lg overflow-hidden"
                >
                  {images.map((image) => (
                    <SwiperSlide key={image.id}>
                      <div className="relative w-full h-full">
                        <Image
                          src={image.url}
                          alt="Preview"
                          fill
                          className={`object-cover ${selectedFilter}`}
                        />
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>
              
              <div className="md:w-1/2 md:pl-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Caption
                  </label>
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Write a caption..."
                    className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={6}
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Add Location
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPinIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Add location"
                      className="w-full pl-10 p-3 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div className="border-t border-gray-200 dark:border-gray-800 py-2">
                  <button className="flex items-center p-2 w-full hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md">
                    <TagIcon className="h-5 w-5 mr-2 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm">Tag People</span>
                  </button>
                </div>
                
                <div className="border-t border-gray-200 dark:border-gray-800 py-2">
                  <button className="flex items-center p-2 w-full hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md">
                    <FaceSmileIcon className="h-5 w-5 mr-2 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm">Add Emojis</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {isSubmitting && (
          <div className="absolute inset-0 bg-white bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>
    </div>
  );
}
