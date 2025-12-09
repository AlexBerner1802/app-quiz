import styled from "styled-components";
import LeaderboardPodium from "./LeaderboardPodium";

export function LeaderboardPodiumSmall({ quizEntries }) {
    return <LeaderboardPodium quizEntries={quizEntries} size={0.6}/>;
}
