import { useEffect, useState } from 'react'
import { BottomNav, type Tab } from './components/BottomNav.tsx'
import { categoryName, type CategoryId } from './data/categories.ts'
import { QUESTIONS } from './data/questions.ts'
import { toDay } from './lib/dates.ts'
import type { ChallengeInfo } from './lib/challenges.ts'
import { countDue } from './lib/reviews.ts'
import { newChallengeSeed, type RoundRequest } from './lib/round.ts'
import type { Session } from './lib/session.ts'
import { cleanName } from './lib/progress.ts'
import { dailyShareText, seedShareText, type ParseResult } from './lib/share.ts'
import { finishRound, leveledUp, levelsAfterExit, type RoundSummary } from './lib/summary.ts'
import type { Level } from './lib/xp.ts'
import { appUrl, takeChallengeFromUrl } from './platform/share.ts'
import { useProgress } from './progress/useProgress.ts'
import { CategoryScreen } from './screens/CategoryScreen.tsx'
import { ChallengeScreen } from './screens/ChallengeScreen.tsx'
import { HomeScreen } from './screens/HomeScreen.tsx'
import { LevelUpScreen } from './screens/LevelUpScreen.tsx'
import { OnboardingScreen } from './screens/OnboardingScreen.tsx'
import { ProfileScreen } from './screens/ProfileScreen.tsx'
import { RankingScreen } from './screens/RankingScreen.tsx'
import { ResultScreen } from './screens/ResultScreen.tsx'
import { ReviewsScreen } from './screens/ReviewsScreen.tsx'
import { RoundScreen } from './screens/RoundScreen.tsx'

/** Ekran, do którego wracamy po rundzie (zakładka albo ścieżka wiedzy). */
type Place = { name: 'tab'; tab: Tab } | { name: 'category'; category: CategoryId }

/** Ekrany przełączane stanem (bez routera w MVP). */
type Screen =
  | Place
  | { name: 'round'; request: RoundRequest; id: number; back: Place; challenge?: ChallengeInfo }
  | { name: 'result'; request: RoundRequest; summary: RoundSummary; today: string; back: Place }
  | { name: 'challenge'; link: ChallengeLink }
  | { name: 'levelUp'; level: Level; then: Screen }
  | { name: 'onboarding'; then: Screen }

type ChallengeLink = Exclude<ParseResult, { status: 'none' }>

const HOME: Place = { name: 'tab', tab: 'home' }

/** Napis na chipie ekranu Wynik. */
function resultLabel(request: RoundRequest, summary: RoundSummary): string {
  switch (request.mode) {
    case 'daily':
      return summary.training ? 'Wyzwanie dnia · trening' : 'Wyzwanie dnia ukończone'
    case 'challenge':
      return 'Wyzwanie ukończone'
    case 'category':
      return `${categoryName(request.category)} · runda ukończona`
    case 'quick':
      return 'Szybka runda'
    case 'learn':
      return 'Nauka bez stresu'
    case 'review':
      return 'Powtórki ukończone'
  }
}

/** Runda → Wynik → (Nowy poziom) → ekran, z którego zaczęto rundę. */
export function App() {
  const { progress, loadStatus, updateProgress } = useProgress()
  // Brak zapisu albo zapis nieczytelny → Powitanie (EKRANY.md, pkt 1); link z wyzwaniem → ekran Wyzwania
  // (dla nowego gracza po Powitaniu).
  const [screen, setScreen] = useState<Screen>(() => {
    const link = takeChallengeFromUrl(QUESTIONS.length)
    const first: Screen = link.status === 'none' ? HOME : { name: 'challenge', link }
    return loadStatus === 'new' || loadStatus === 'corrupt' ? { name: 'onboarding', then: first } : first
  })

  // Link wklejony w otwartej już karcie zmienia tylko część `#` — bez przeładowania strony.
  useEffect(() => {
    const onHash = () => {
      const link = takeChallengeFromUrl(QUESTIONS.length)
      if (link.status === 'none') return
      setScreen((s) => (s.name === 'onboarding' ? { ...s, then: { name: 'challenge', link } } : { name: 'challenge', link }))
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  const today = toDay(new Date())
  const reviewsDue = countDue(progress.questions, today)

  const play = (request: RoundRequest, back: Place, challenge?: ChallengeInfo) =>
    setScreen({ name: 'round', request, id: Date.now(), back, challenge })

  /** „Wyzwij znajomego”: runda z nowym ziarnem; link z wynikiem wysyła się z ekranu Wynik. */
  const newChallenge = (back: Place) => {
    const seed = newChallengeSeed(Math.random)
    play({ mode: 'challenge', seed }, back, { seed, from: '', theirs: [] })
  }

  /** Po wyniku albo przerwanej rundzie: najpierw ekran awansu, jeśli poziom wzrósł. */
  const leave = (levels: { levelBefore: Level; levelAfter: Level }, then: Screen) =>
    setScreen(leveledUp(levels) ? { name: 'levelUp', level: levels.levelAfter, then } : then)

  switch (screen.name) {
    case 'onboarding':
      return (
        <OnboardingScreen
          onStart={(name) => {
            // Zapis od razu — także z pustym imieniem — żeby Powitanie nie wróciło przy następnym uruchomieniu.
            updateProgress((p) => ({ ...p, name: cleanName(name) }))
            setScreen(screen.then)
          }}
        />
      )

    case 'round': {
      const { request, back, challenge } = screen
      return (
        <RoundScreen
          key={screen.id}
          request={request}
          onFinish={(session: Session, day: string) => {
            // Funkcja z updateProgress działa od razu na bieżącym postępie (także z ostatnią odpowiedzią).
            const out: { summary?: RoundSummary } = {}
            updateProgress((p) => {
              const r = finishRound(p, session, day, { challenge })
              out.summary = r.summary
              return r.progress
            })
            if (out.summary) setScreen({ name: 'result', request, summary: out.summary, today: day, back })
          }}
          onExit={(session: Session) => leave(levelsAfterExit(progress, session), back)}
        />
      )
    }

    case 'result': {
      const { request, summary, back } = screen
      const shareOpts = { name: progress.name, base: appUrl(), bankSize: QUESTIONS.length }
      const text =
        request.mode === 'daily' && summary.dailyResults
          ? dailyShareText(screen.today, summary.dailyResults, shareOpts)
          : request.mode === 'challenge'
            ? seedShareText('Wyzwanie', request.seed, summary.results, shareOpts)
            : null
      const canReplay = request.mode !== 'review' || reviewsDue > 0
      return (
        <ResultScreen
          summary={summary}
          label={resultLabel(request, summary)}
          shareText={text}
          onReplay={canReplay ? () => leave(summary, { name: 'round', request, id: Date.now(), back }) : null}
          onDone={() => leave(summary, back)}
        />
      )
    }

    case 'levelUp': {
      const { then } = screen
      // Nowa runda dostaje świeży klucz, żeby nie wznowić starej.
      return (
        <LevelUpScreen
          level={screen.level}
          onContinue={() => setScreen(then.name === 'round' ? { ...then, id: Date.now() } : then)}
        />
      )
    }

    case 'challenge':
      return (
        <ChallengeScreen
          key={JSON.stringify(screen.link)}
          link={screen.link}
          onAccept={(challenge) => play({ mode: 'challenge', seed: challenge.seed }, HOME, challenge)}
          onClose={() => setScreen(HOME)}
        />
      )

    case 'category': {
      const place: Place = screen
      return (
        <CategoryScreen
          key={screen.category}
          category={screen.category}
          onBack={() => setScreen(HOME)}
          onPlay={(request) => play(request, place)}
        />
      )
    }

    case 'tab': {
      const place: Place = screen
      return (
        <>
          {screen.tab === 'home' && (
            <HomeScreen
              onPlay={(request) => play(request, place)}
              onOpenCategory={(category) => setScreen({ name: 'category', category })}
              onNewChallenge={() => newChallenge(place)}
            />
          )}
          {screen.tab === 'reviews' && <ReviewsScreen onPlay={(request) => play(request, place)} />}
          {screen.tab === 'ranking' && <RankingScreen onNewChallenge={() => newChallenge(place)} />}
          {screen.tab === 'profile' && <ProfileScreen onReset={() => setScreen({ name: 'onboarding', then: HOME })} />}
          <BottomNav
            active={screen.tab}
            reviewsDue={reviewsDue}
            onSelect={(tab) => {
              setScreen({ name: 'tab', tab })
              window.scrollTo({ top: 0 })
            }}
          />
        </>
      )
    }
  }
}
