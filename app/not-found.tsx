import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Home, ArrowLeft, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center space-y-6">
            {/* 404 Icon */}
            <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center">
              <span className="text-4xl font-bold text-muted-foreground">404</span>
            </div>
            
            {/* Title */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">
                页面未找到
              </h1>
              <p className="text-muted-foreground">
                抱歉，您访问的页面不存在或已被移除。
              </p>
            </div>
            
            {/* Action Buttons */}
            <div className="space-y-3">
              <Button asChild className="w-full">
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  返回首页
                </Link>
              </Button>
              
              <div className="flex gap-2">
                <Button variant="outline" asChild className="flex-1">
                  <Link href="/trending">
                    <Search className="mr-2 h-4 w-4" />
                    热门文章
                  </Link>
                </Button>
                
                <Button variant="outline" onClick={() => window.history.back()} className="flex-1">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  返回上页
                </Button>
              </div>
            </div>
            
            {/* Help Text */}
            <div className="text-sm text-muted-foreground">
              <p>如果您认为这是一个错误，请联系我们。</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}