import { createClient } from '@supabase/supabase-js';
import { TwitterClient, createTwitterClient } from '../lib/twitter';
import dotenv from 'dotenv';

// Generate URL-friendly slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .slice(0, 100) // Limit length
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
}

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const twitterClient = createTwitterClient();

// Article URLs to process
const tweetUrls = [
  'https://x.com/mobyagent/status/1932462252109480065',
  'https://x.com/getmoni_io/status/1910321579461931185',
  'https://x.com/Mira_Network/status/1937884528481038641',
  'https://x.com/Mira_Network/status/1930649502408753391',
  'https://x.com/heavendex/status/1957622426096795875',
  'https://x.com/mobyagent/status/1940449573597495697',
  'https://x.com/wallet/status/1932707552032080209',
  'https://x.com/tetsuoai/status/1947186471150157931',
  'https://x.com/tetsuoai/status/1941652777303932974',
  'https://x.com/tetsuoai/status/1792127620072825143',
  'https://x.com/Phyrex_Ni/status/1935228362894815518',
  'https://x.com/roger9949/status/1926564306788733153',
  'https://x.com/tetsuoai/status/1941815795165872421',
  'https://x.com/tetsuoai/status/1941225522681479677',
  'https://x.com/tetsuoai/status/1941153428639715789',
  'https://x.com/getmoni_io/status/1940347306521362662',
  'https://x.com/tetsuoai/status/1941951721187766689',
  'https://x.com/HoloworldAI/status/1933285730865828241',
  'https://x.com/Covalent_HQ/status/1957915320754266546',
  'https://x.com/Ga__ke/status/1898941696144252930',
  'https://x.com/tetsuoai/status/1942154874055278918',
  'https://x.com/danielesesta/status/1932933919470457214',
  'https://x.com/HoloworldAI/status/1943711461647192111',
  'https://x.com/Phyrex_Ni/status/1945418518352331166',
  'https://x.com/SpaceIDProtocol/status/1925928316147544115',
  'https://x.com/HoloworldAI/status/1928869453376401585',
  'https://x.com/0x_xifeng/status/1954085092407882141',
  'https://x.com/Phyrex_Ni/status/1927617196509057347',
  'https://x.com/munchPRMR/status/1947477173826171061',
  'https://x.com/Phyrex_Ni/status/1953169889612710388',
  'https://x.com/S4mmyEth/status/1950187573495595063',
  'https://x.com/S4mmyEth/status/1945082220303020103',
  'https://x.com/mobyagent/status/1932459160785801603',
  'https://x.com/Phyrex_Ni/status/1932718441301246323',
  'https://x.com/Phyrex_Ni/status/1925088823505195024',
  'https://x.com/Phyrex_Ni/status/1948003384235323564',
  'https://x.com/MasonCanoe/status/1896877269324595305',
  'https://x.com/wallet/status/1950732288754659694',
  'https://x.com/BitBenderBrink/status/1957733363604672844',
  'https://x.com/X/status/1953897610806206947',
  'https://x.com/0x_xifeng/status/1943486018776338533',
  'https://x.com/X/status/1956416921017966887',
  'https://x.com/MiyaHedge/status/1949475904159093081',
  'https://x.com/buidlpad/status/1957960911463018625',
  'https://x.com/Mira_Network/status/1953405002996662421',
  'https://x.com/tetsuoai/status/1957382250808705362',
  'https://x.com/S4mmyEth/status/1955275653072183370',
  'https://x.com/0x_xifeng/status/1955793637704654877',
  'https://x.com/sadd_asd77675/status/1894515832098861489',
  'https://x.com/jsuarez5341/status/1943692998975402064',
  'https://x.com/Phyrex_Ni/status/1937809368051015730',
  'https://x.com/KayTheDoc/status/1957021509010231394',
  'https://x.com/CowellCrypto/status/1942949869909311996',
  'https://x.com/wallet/status/1927725379135136235',
  'https://x.com/AndreCronjeTech/status/1890754309005935045',
  'https://x.com/Phyrex_Ni/status/1955628720024387980',
  'https://x.com/CowellCrypto/status/1938531812738830627',
  'https://x.com/tetsuoai/status/1955028490979623390',
  'https://x.com/0x_xifeng/status/1954700962821709990',
  'https://x.com/HoloworldAI/status/1948449609711583327',
  'https://x.com/HoloworldAI/status/1954245156649222462',
  'https://x.com/tetsuoai/status/1955023069048869043',
  'https://x.com/lucas_faster/status/1918307973086265760',
  'https://x.com/S4mmyEth/status/1957850622557901123',
  'https://x.com/scattering_io/status/1943237957055389892',
  'https://x.com/Ethereum_OS/status/1957854061975204225',
  'https://x.com/balajis/status/1929557752713822686',
  'https://x.com/X/status/1948830753976201298',
  'https://x.com/X/status/1936137666443329694',
  'https://x.com/X/status/1943747681416827253',
  'https://x.com/maverick23NFT/status/1957772943397957699',
  'https://x.com/X/status/1941224644754702675',
  'https://x.com/X/status/1938681985666355485',
  'https://x.com/X/status/1946290389540827319',
  'https://x.com/X/status/1951355118068113461',
  'https://x.com/Rugcheckxyz/status/1900552758064714218',
  'https://x.com/lucas_faster/status/1914284230450024887',
  'https://x.com/sadd_asd77675/status/1896026368133251348',
  'https://x.com/Rugcheckxyz/status/1901661150330405342',
  'https://x.com/S4mmyEth/status/1945082220303020103',
  'https://x.com/lucas_faster/status/1919348617154101588',
  'https://x.com/danielesesta/status/1904490777549365738',
  'https://x.com/off_thetarget/status/1910550872679211277',
  'https://x.com/danielesesta/status/1907440905386107240',
  'https://x.com/danielesesta/status/1916116056877289686',
  'https://x.com/tmccorp_project/status/1912050351026614740',
  'https://x.com/Cobratate/status/1957729985151529066',
  'https://x.com/StalkHQ/status/1953835211709390859',
  'https://x.com/danielesesta/status/1923029258852597853',
  'http://x.com/Mira_Network/status/1909557534689485230',
  'https://x.com/getmoni_io/status/1899472362791129255',
  'https://x.com/0xSunNFT/status/1869976608981061987',
  'https://x.com/S4mmyEth/status/1955275653072183370',
  'https://x.com/getmoni_io/status/1903421704585540095',
  'https://x.com/getmoni_io/status/1915451012480933959',
  'https://x.com/cryptofishx/status/1957795134806061297',
  'https://x.com/Rugcheckxyz/status/1910029210602897735',
  'https://x.com/Mira_Network/status/1915054541214556551',
  'https://x.com/FinanzasArgy/status/1957823643917902200',
  'https://x.com/Teslarati/status/1957855387266478467',
  'https://x.com/yoheinakajima/status/1865196403171131795',
  'https://x.com/S4mmyEth/status/1895172904490332654',
  'https://x.com/S4mmyEth/status/1947681091877282151',
  'https://x.com/Mira_Network/status/1912527377617268903',
  'https://x.com/BasedMikeLee/status/1957672973080613203',
  'https://x.com/getmoni_io/status/1897209530536124869',
  'https://x.com/StalkHQ/status/1922595174393250216',
  'https://x.com/Mira_Network/status/1907450036675600589',
  'https://x.com/StalkHQ/status/1915913489995980923',
  'https://x.com/StalkHQ/status/1916852870504136709',
  'https://x.com/TrumpWarRoom/status/1953124402742038826',
  'https://x.com/iamcoachcrypto/status/1828058169131557120',
  'https://x.com/Breaking911/status/1957605453887856788',
  'https://x.com/Luyaoyuan1/status/1871867581461913856',
  'https://x.com/StalkHQ/status/1918055448164393186',
  'https://x.com/Luyaoyuan1/status/1853391764192924083',
  'https://x.com/GordoLeyes/status/1957637661276950625',
  'https://x.com/CryptoEights/status/1914898489190096948',
  'https://x.com/CryptoEights/status/1921575591725379899',
  'https://x.com/Luyaoyuan1/status/1866839363612709143',
  'https://x.com/GordoLeyes/status/1957887406830391658',
  'https://x.com/GordoLeyes/status/1957889945378369997',
  'https://x.com/getmoni_io/status/1901974133564653959',
  'https://x.com/splinter0n/status/1957780518646477045',
  'https://x.com/Infinit_Labs/status/1957745575623119069',
  'https://x.com/crypthoem/status/1957918546249564609',
  'https://x.com/Emperor_coinsol/status/1957901779712241994',
  'https://x.com/etherfi_VC/status/1957926413820100834',
  'https://x.com/SlayStupidity/status/1957923613895717083',
  'https://x.com/BankQuote_DAG/status/1957475642364002663',
  'https://x.com/VALORANTBrasil/status/1957804279537840262',
  'https://x.com/FinanzasArgy/status/1957915295609168108',
  'https://x.com/RNCResearch/status/1957900527699734715',
  'https://x.com/EkoLovesYou/status/1957585068496679430',
  'https://x.com/MoonbeamNetwork/status/1957504899534524447',
  'https://x.com/cysic_xyz/status/1957505608351117612',
  'https://x.com/SuhailKakar/status/1957708281423729055',
  'https://x.com/realyanxin/status/1957448740794441901',
  'https://x.com/Cheshire_Cap/status/1957466976067928131',
  'https://x.com/Habbo/status/1957724551191601312',
  'https://x.com/RelayProtocol/status/1957499125051654374',
  'https://x.com/boundless_xyz/status/1957498468093587905',
  'https://x.com/SunriseLayer/status/1957559574472626294',
  'https://x.com/Cobratate/status/1957403380026155308',
  'https://x.com/playsomo/status/1957433308519989713',
  'https://x.com/Teslarati/status/1957602834759012415',
  'https://x.com/1CryptoMama/status/1957362806967464410',
  'https://x.com/Teslarati/status/1957367091331522633',
  'https://x.com/Teslarati/status/1957375210816237996',
  'https://x.com/Teslarati/status/1957463875642650766',
  'https://x.com/Teslarati/status/1957412278980272131',
  'https://x.com/Teslarati/status/1957371458168250624',
  'https://x.com/FinanzasArgy/status/1957405848965124449',
  'https://x.com/clarincom/status/1957407200407613844',
  'https://x.com/2lambro/status/1957290122980028843',
  'https://x.com/pharos_network/status/1957355172927357361',
  'https://x.com/A_PoppOffiziell/status/1957411049755332660',
  'https://x.com/FirstDescendant/status/1957361838964006977',
  'https://x.com/zeebuofficial/status/1957451153341325651',
  'https://x.com/Louround_/status/1957191276874408007',
  'https://x.com/crypthoem/status/1957125483679653945',
  'https://x.com/Bybit_Official/status/1957467540713623635',
  'https://x.com/RubiksWeb3hub/status/1957378583212568909',
  'https://x.com/MorphLayer/status/1957153116413190504',
  'https://x.com/theblessnetwork/status/1957170568307909033',
  'https://x.com/SerrDavee/status/1957357519992435100',
  'https://x.com/beast_ico/status/1957240296774738415',
  'https://x.com/DexCheck_io/status/1957121763252592679',
  'https://x.com/OlimpioCrypto/status/1957427663359910392',
  'https://x.com/clarincom/status/1957181445568369008',
  'https://x.com/SecRollins/status/1957140624211058982',
  'https://x.com/FinanzasArgy/status/1957136279935816000',
  'https://x.com/ifixhearts/status/1957246464058404973',
  'https://x.com/DeepSafe_AI/status/1957359444289102176',
  'https://x.com/DegenApe99/status/1957099384933597363',
  'https://x.com/arndxt_xo/status/1957098182439236063',
  'https://x.com/AITECHio/status/1957110200575410404',
  'https://x.com/BioProtocol/status/1957111167773491216',
  'https://x.com/LuigiGiliberti2/status/1957108810411356174',
  'https://x.com/CherylWroteIt/status/1957124822405718490',
  'https://x.com/ifixhearts/status/1957246464058404973',
  'https://x.com/thecryptoskanda/status/1956970871039684999',
  'https://x.com/clarincom/status/1957064910107754750',
  'https://x.com/Enrique_GomezM/status/1957134739472621852',
  'https://x.com/CherylWroteIt/status/1957060939749969984',
  'https://x.com/_FORAB/status/1957009918021808442',
  'https://x.com/Zun2025/status/1957057333005054264',
  'https://x.com/ThirdTimeIan/status/1957166993842548960',
  'https://x.com/Bybit_Official/status/1957046026054873179',
  'https://x.com/LuigiGiliberti2/status/1957016494325325983',
  'https://x.com/liminalmoney/status/1956737777166672129',
  'https://x.com/fipcrypto/status/1956731358073569415',
  'https://x.com/PortaltoBitcoin/status/1956787225091244143',
  'https://x.com/Defi_Scribbler/status/1956978070042169647',
  'https://x.com/VersanAljarrah/status/1956759282755473429',
  'https://x.com/EmanAbio/status/1956745325156380763',
  'https://x.com/Teslarati/status/1956778833316819449',
  'https://x.com/LuigiGiliberti2/status/1956932815829778601',
  'https://x.com/TrustlessState/status/1956779661683527760',
  'https://x.com/Ethereum_OS/status/1956766860134739997',
  'https://x.com/choffstein/status/1956826218780913998',
  'https://x.com/splinter0n/status/1956644215032865000',
  'https://x.com/jussy_world/status/1956696721330774051',
  'https://x.com/Bybit_Official/status/1956687096543871208',
  'https://x.com/dude_its_ritik/status/1956709761602216384',
  'https://x.com/0xVeryBigOrange/status/1956562199830475236',
  'https://x.com/LLP_Le_Vrai/status/1956720561473679759',
  'https://x.com/alphatrends/status/1956087618929877372',
  'https://x.com/KemiBadenoch/status/1956617036043297092',
  'https://x.com/RicardoBSalinas/status/1956516671608242285',
  'https://x.com/trondao/status/1956433432537608208',
  'https://x.com/reka_eth/status/1956457532110856239',
  'https://x.com/StarPlatinumSOL/status/1956471450359025970',
  'https://x.com/goodalexander/status/1956515923516330000',
  'https://x.com/JohnLeFevre/status/1956485265783951437',
  'https://x.com/clarincom/status/1956502500141302113',
  'https://x.com/Adhwan/status/1956475666964058542',
  'https://x.com/AITECHio/status/1956385419022549166',
  'https://x.com/crypthoem/status/1956366394020282439',
  'https://x.com/SimonLevyMx/status/1956716921484935497',
  'https://x.com/Teslarati/status/1956337641080889544',
  'https://x.com/Novastro_xyz/status/1956734771628839239',
  'https://x.com/Official_NODO/status/1956333344385290542',
  'https://x.com/skate/status/1956400744191467661',
  'https://x.com/Glenn_Diesen/status/1956327338087526551',
  'https://x.com/LuigiGiliberti2/status/1956376183060267286',
  'https://x.com/MemeMarketFun/status/1956643799469277566',
  'https://x.com/MemeMarketFun/status/1956643799469277566',
  'https://x.com/clarincom/status/1956340166366318771',
  'https://x.com/Bybit_Official/status/1956325055094268036',
  'https://x.com/Infinit_Labs/status/1956325912322130363',
  'https://x.com/playoffthegrid/status/1956312870045544740',
  'https://x.com/Jonathan_K_Cook/status/1956325210505859098',
  'https://x.com/getbeluga/status/1956416579434143750',
  'https://x.com/Teslarati/status/1956320646524436883',
  'https://x.com/mafiagame/status/1956424178644418859',
  'https://x.com/MoonbeamNetwork/status/1956046477320401381',
  'https://x.com/crypthoem/status/1956073960220860613',
  'https://x.com/alphatrends/status/1956087618929877372',
  'https://x.com/imtomcurry/status/1956045595509916116',
  'https://x.com/PrudentSammy/status/1956061631558848861',
  'https://x.com/Pi_Squared_Pi2/status/1956051215844094364',
  'https://x.com/Teslarati/status/1956085567113875896',
  'https://x.com/ihat/status/1956214332557287460',
  'https://x.com/zama_fhe/status/1956377855064973721',
  'https://x.com/citrea_xyz/status/1956074782916477180',
  'https://x.com/OpenverseGlobal/status/1956387250817888691',
  'https://x.com/imtomcurry/status/1956045595509916116',
  'https://x.com/daijapan/status/1956167770955243798',
  'https://x.com/SpekterAgency/status/1956134543481876967',
  'https://x.com/ghitis/status/1956117476070318443',
  'https://x.com/Dashpay/status/1956000688997052459',
  'https://x.com/MarianneNFTs/status/1956001526360441279',
  'https://x.com/crypto_rand/status/1955986782979260794',
  'https://x.com/klok_app/status/1955994951327866958',
  'https://x.com/DayZ/status/1955981967389864369',
  'https://x.com/XyBrainz/status/1956008007998767257',
  'https://x.com/Cobratate/status/1956047738912559548',
  'https://x.com/XyBrainz/status/1956036185836646730',
  'https://x.com/FirstDescendant/status/1956022308465942826',
  'https://x.com/FDanglehan56893/status/1955906714668065238',
  'https://x.com/HYTOPIAgg/status/1956030266201321747',
  'https://x.com/Habbo/status/1955902640128221232',
  'https://x.com/Teslarati/status/1955933867229241544',
  'https://x.com/Teslarati/status/1955957007363793216',
  'https://x.com/BTC563/status/1955956450578325740',
  'https://x.com/Aizenberg55/status/1955985844596015153',
  'https://x.com/ArleteCaetana/status/1955976854378053660',
  'https://x.com/clarincom/status/1955944741385666982',
  'https://x.com/peacefuldecay/status/1955733459630268645',
  'https://x.com/openmind_agi/status/1955688472309530694',
  'https://x.com/Ethereum_OS/status/1955679743916818625',
  'https://x.com/Teslarati/status/1956043380409970703',
  'https://x.com/Teslarati/status/1955721754753818937',
  'https://x.com/GOATRollup/status/1955899517582368986',
  'https://x.com/amuse/status/1955700748534116548',
  'https://x.com/amuse/status/1955675030521565690',
  'https://x.com/Teslarati/status/1955669496888242578',
  'https://x.com/CowellCrypto/status/1864330098502975764',
  'https://x.com/CryptoEights/status/1916155768660963837',
  'https://x.com/NiallHarbison/status/1878442079023763585'
];

interface ArticleData {
  title: string;
  slug: string;
  author_name: string;
  published_time: string;
  image?: string;
  author_handle: string;
  author_avatar?: string;
  description?: string;
}

function extractTweetId(url: string): string {
  const match = url.match(/status\/(\d+)/);
  return match ? match[1] : '';
}

function extractAuthorHandle(url: string): string {
  const match = url.match(/x\.com\/([^/]+)\//);
  return match ? match[1] : '';
}

function extractArticleInfo(tweetData: any): ArticleData | null {
  try {
    const tweet = tweetData.legacy;
    const user = tweetData.core?.user_results?.result?.legacy;
    
    if (!tweet || !user) {
      console.log('Missing tweet or user data');
      return null;
    }

    // Extract article URL from tweet text
    const urlRegex = /https?:\/\/[^\s]+/g;
    const urls = tweet.full_text?.match(urlRegex) || [];
    const articleUrl = urls.find((url: string) => 
      !url.includes('x.com') && 
      !url.includes('twitter.com') &&
      !url.includes('t.co')
    );

    if (!articleUrl) {
      console.log('No article URL found in tweet');
      return null;
    }

    // Use tweet text as title if no article title is available
    const title = tweet.full_text?.replace(urlRegex, '').trim() || 'Untitled Article';
    
    // Generate slug from title
    const slug = generateSlug(title);
    
    // Extract description from tweet text (first 200 chars)
    const description = tweet.full_text?.substring(0, 200) || '';
    
    return {
      title,
      slug,
      author_name: user.name || 'Unknown Author',
      published_time: new Date(tweet.created_at).toISOString(),
      image: tweet.entities?.media?.[0]?.media_url_https,
      author_handle: user.screen_name || '',
      author_avatar: user.profile_image_url_https,
      description
    };
  } catch (error) {
    console.error('Error extracting article info:', error);
    return null;
  }
}

async function processArticleBatch() {
  console.log(`Starting to process ${tweetUrls.length} tweet URLs...`);
  
  let successCount = 0;
  let errorCount = 0;
  const errors: string[] = [];

  for (let i = 0; i < tweetUrls.length; i++) {
    const url = tweetUrls[i];
    const tweetId = extractTweetId(url);
    
    if (!tweetId) {
      console.log(`❌ Invalid URL format: ${url}`);
      errorCount++;
      errors.push(`Invalid URL format: ${url}`);
      continue;
    }

    try {
      console.log(`\n[${i + 1}/${tweetUrls.length}] Processing: ${url}`);
      
      // Check if article already exists
      const { data: existingArticle } = await supabase
        .from('articles')
        .select('id')
        .eq('slug', generateSlug(tweetId))
        .single();

      if (existingArticle) {
        console.log(`⏭️  Article already exists, skipping...`);
        continue;
      }

      // Fetch tweet data
      // Note: Individual tweet fetching not implemented in current TwitterClient
    // This would need to be implemented or use a different approach
    const tweetData = null; // await twitterClient.fetchTweetById(tweetId);
      
      if (!tweetData) {
        console.log(`❌ Failed to fetch tweet data`);
        errorCount++;
        errors.push(`Failed to fetch tweet data for ${url}`);
        continue;
      }

      // Extract article information
      const articleData = extractArticleInfo(tweetData);
      
      if (!articleData) {
        console.log(`❌ Failed to extract article info`);
        errorCount++;
        errors.push(`Failed to extract article info for ${url}`);
        continue;
      }

      // Save to database
      const { error: insertError } = await supabase
        .from('articles')
        .insert([articleData]);

      if (insertError) {
        console.log(`❌ Database error:`, insertError.message);
        errorCount++;
        errors.push(`Database error for ${url}: ${insertError.message}`);
        continue;
      }

      console.log(`✅ Successfully processed: ${articleData.title}`);
      successCount++;

      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.log(`❌ Error processing ${url}:`, error);
      errorCount++;
      errors.push(`Error processing ${url}: ${error}`);
    }
  }

  console.log(`\n📊 Processing Summary:`);
  console.log(`✅ Successfully processed: ${successCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📝 Total URLs: ${tweetUrls.length}`);
  
  if (errors.length > 0) {
    console.log(`\n❌ Error Details:`);
    errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
  }
}

// Run the batch processing
processArticleBatch().catch(console.error);