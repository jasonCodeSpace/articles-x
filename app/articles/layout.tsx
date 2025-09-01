import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ModernNav } from '@/components/modern-nav'

interface ProtectedLayoutProps {
  children: React.ReactNode
}

export default async function ProtectedLayout({
  children,
}: ProtectedLayoutProps) {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch categories
  let categories: string[] = [];
  try {
    const { data, error } = await supabase
      .from('articles')
      .select('category')
      .not('category', 'is', null);

    if (error) {
      console.error('Error fetching categories:', error);
    } else {
      const uniqueCategories = new Set<string>();
      data?.forEach(article => {
        if (article.category) {
          // Only take the first category for single tag support
          const firstCategory = article.category.split(',')[0].trim();
          uniqueCategories.add(firstCategory);
        }
      });
      categories = Array.from(uniqueCategories).sort();
    }
  } catch (error) {
    console.error('Error fetching categories:', error);
  }





  return (
    <div className="min-h-screen bg-black">
      <ModernNav user={user ?? undefined} categories={categories} />
      
      {/* Main Content */}
      <div className="pt-20 md:pt-16 pb-20 md:pb-0">
        {children}
      </div>
    </div>
  )
}