{-
Copyright 2023 Google LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    https://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
-}

-- |
-- Description: Hooks up sub-modules together.
-- Copyright: Copyright 2023 Google LLC
-- License: Apache-2.0
-- Maintainer: chungyc@google.com
--
-- This is a GitHub action which scans Haskell code
-- with [HLint](https://github.com/ndmitchell/hlint), which it then uploads
-- to [GitHub code scanning dashboards](https://docs.github.com/en/code-security/code-scanning/automatically-scanning-your-code-for-vulnerabilities-and-errors/about-code-scanning).
-- See [haskell-actions/hlint-scan](https://github.com/haskell-actions/hlint-scan)
-- for more details.
--
-- This specific module ties together sub-modules, which are responsible
-- for processing various stages of the analysis and upload.
-- Basically, the sub-modules are responsible for the pure computations,
-- and this module is responsible for tying them together with the 'IO' actions.
module Scan (main) where

import Arguments qualified
import AutomationDetails qualified
import Control.Monad (when)
import Data.Aeson (Value, decode, encode)
import Data.ByteString.Lazy
import Data.Maybe (isJust)
import Data.String
import FilePath qualified
import Fingerprint qualified
import Format (formatMessages)
import GitHub.REST
import Rules qualified
import System.Environment (getEnvironment)
import System.Exit (ExitCode (ExitSuccess), die, exitWith)
import System.Process (proc, readCreateProcessWithExitCode)
import Upload (toCall, toOutputs, toSettings)
import Prelude hiding (putStr)

-- | Context that will be carried through most of the work flow.
--
-- In particular, this is used to pass on the category and access token
-- which would have been passed in as arguments to the program
-- from the argument parsing stage to the API call to GitHub.
data Context = Context
  { category :: Maybe String,
    gitHubToken :: Maybe String,
    runnerDebug :: Bool
  }

-- The work stages are basically the following:
--
--   1. 'main': Effectively the main program, and validates the program arguments.
--   2. 'invoke': Invokes the HLint binary.
--   3. 'annotate': Rewrites SARIF output with extra information.
--   4. 'send': Sets up the GitHub REST API.
--   5. 'call': Actually calls the GitHub REST API.

-- | Effectively serves as the @main@ function for the scanning program.
main ::
  -- | The program arguments.
  [String] ->
  IO ()
main args = case Arguments.validate args of
  Nothing -> invoke args
  Just errors -> die errors

invoke :: [String] -> IO ()
invoke args = do
  let (executable, flags, category, token) = Arguments.translate args
  (exitCode, out, err) <-
    readCreateProcessWithExitCode (proc executable flags) ""

  env <- getEnvironment
  let context =
        Context
          { category = category,
            gitHubToken = token,
            runnerDebug = isJust (lookup "RUNNER_DEBUG" env)
          }

  when (runnerDebug context) $ do
    putStrLn "Output from hlint:"
    putStrLn out
    putStrLn ""

  case exitCode of
    ExitSuccess -> annotate context $ fromString out
    _ -> putStrLn err >> exitWith exitCode

annotate :: Context -> ByteString -> IO ()
annotate context output = do
  env <- getEnvironment
  let annotated =
        formatMessages
          . FilePath.normalize
          . Fingerprint.fill
          . Rules.add
          . AutomationDetails.add env (category context)
          <$> value

  when (runnerDebug context) $ do
    putStrLn "rewritten output:"
    print annotated
    putStrLn ""

  case annotated of
    Nothing -> die $ "invalid encoding\n" <> show output <> "\n"
    Just output' -> send context $ encode output'
  where
    value = decode output :: Maybe Value

send :: Context -> ByteString -> IO ()
send context output = do
  env <- getEnvironment
  let settings = toSettings $ gitHubToken context
  let endpoint' = toCall env output
  case endpoint' of
    Just endpoint -> call settings endpoint
    _ -> do
      when (runnerDebug context) $ do
        putStrLn "environment variables"
        print env
        putStrLn ""
      die "not all necessary environment variables available"

call :: GitHubSettings -> GHEndpoint -> IO ()
call settings endpoint =
  putStrLn . unlines . toOutputs
    =<< runGitHubT settings (queryGitHub endpoint)
