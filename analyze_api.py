import json

# Load the API response for the article tweet
with open('/tmp/article_tweet_test.json', 'r') as f:
    data = json.load(f)

print('=== API Response Analysis for Tweet 1831002470525423946 ===')
print('Keys in data:', list(data.keys()))

# Check if this is an error response
if 'error' in data:
    print('ERROR:', data['error'])
    exit()

# Look for the main tweet content
if 'data' in data:
    conv = data['data'].get('threaded_conversation_with_injections_v2', {})
    instructions = conv.get('instructions', [])
    
    print(f'\nFound {len(instructions)} instructions')
    
    for i, instruction in enumerate(instructions):
        entries = instruction.get('entries', [])
        print(f'Instruction {i}: {len(entries)} entries')
        
        for j, entry in enumerate(entries):
            content = entry.get('content', {})
            
            # Check for tweet content
            if 'itemContent' in content:
                item_content = content['itemContent']
                tweet_results = item_content.get('tweet_results', {})
                result = tweet_results.get('result', {})
                
                if result:
                    print(f'\n--- Entry {j} Tweet Content ---')
                    
                    # Check legacy data
                    legacy = result.get('legacy', {})
                    if legacy:
                        print('Full text:', legacy.get('full_text', 'N/A')[:100] + '...')
                        
                        # Check entities for URLs
                        entities = legacy.get('entities', {})
                        urls = entities.get('urls', [])
                        print(f'Found {len(urls)} URLs:')
                        for url in urls:
                            print(f'  - {url.get("expanded_url", "N/A")}')
                    
                    # Check for article_results
                    if 'article_results' in result:
                        print('FOUND article_results!')
                        print('Article results:', result['article_results'])
                    
                    # Check for article field
                    if 'article' in result:
                        print('FOUND article field!')
                        print('Article:', result['article'])
else:
    print('No data field found in response')
    print('Response content:', json.dumps(data, indent=2)[:500])