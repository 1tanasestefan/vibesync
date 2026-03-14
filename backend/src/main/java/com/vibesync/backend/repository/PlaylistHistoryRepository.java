package com.vibesync.backend.repository;

import com.vibesync.backend.model.PlaylistHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface PlaylistHistoryRepository extends JpaRepository<PlaylistHistory, UUID> {

    /** Retrieve a user's playlist generation history, newest first. */
    List<PlaylistHistory> findByUserIdOrderByCreatedAtDesc(String userId);

    /** Retrieve all history entries created after the given timestamp. */
    List<PlaylistHistory> findByCreatedAtAfter(Instant since);
}
